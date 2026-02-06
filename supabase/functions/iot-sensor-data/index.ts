import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sensor-key',
}

interface SensorData {
  station_code: string;
  sensor_type: 'niveau' | 'debit' | 'ouverture' | 'temperature';
  carburant?: 'essence' | 'gasoil' | 'gpl' | 'lubrifiants';
  valeur: number;
  unite: string;
  timestamp?: string;
  sensor_id?: string;
  batterie_niveau?: number;
  signal_qualite?: number;
}

interface SensorPayload {
  sensor_key: string;
  data: SensorData[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate sensor key from header or body
    const sensorKey = req.headers.get('x-sensor-key')
    const payload: SensorPayload = await req.json()
    
    const validKey = sensorKey || payload.sensor_key
    
    // In production, validate against stored API keys
    // For now, accept any non-empty key for demo
    if (!validKey || validKey.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Invalid sensor key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results: any[] = []
    const errors: any[] = []

    for (const data of payload.data) {
      try {
        // Find station by code
        const { data: station, error: stationError } = await supabase
          .from('stations')
          .select('id, nom, entreprise_id, stock_essence, stock_gasoil, stock_gpl, stock_lubrifiants, capacite_essence, capacite_gasoil')
          .eq('code', data.station_code)
          .single()

        if (stationError || !station) {
          errors.push({ 
            station_code: data.station_code, 
            error: 'Station not found' 
          })
          continue
        }

        // Process based on sensor type
        if (data.sensor_type === 'niveau' && data.carburant) {
          // Update stock level - sonde magnétostrictive
          const stockField = `stock_${data.carburant}` as keyof typeof station
          const newStock = Math.round(data.valeur) // valeur en litres

          const updateData: Record<string, any> = {}
          updateData[stockField] = newStock

          const { error: updateError } = await supabase
            .from('stations')
            .update(updateData)
            .eq('id', station.id)

          if (updateError) {
            errors.push({ 
              station_code: data.station_code, 
              sensor_type: data.sensor_type,
              error: updateError.message 
            })
          } else {
            // Log to historique_stocks
            await supabase.from('historique_stocks').insert({
              station_id: station.id,
              date_releve: data.timestamp || new Date().toISOString().split('T')[0],
              stock_essence: data.carburant === 'essence' ? newStock : station.stock_essence,
              stock_gasoil: data.carburant === 'gasoil' ? newStock : station.stock_gasoil,
              stock_gpl: data.carburant === 'gpl' ? newStock : station.stock_gpl,
              stock_lubrifiants: data.carburant === 'lubrifiants' ? newStock : station.stock_lubrifiants,
            })

            results.push({
              station_code: data.station_code,
              sensor_type: data.sensor_type,
              carburant: data.carburant,
              valeur: newStock,
              status: 'updated'
            })
          }
        } 
        else if (data.sensor_type === 'ouverture') {
          // Capteur d'ouverture - Alert on unauthorized access
          if (data.valeur === 1) { // 1 = ouvert
            // Check if it's during authorized hours (6h-22h local time)
            const now = new Date()
            const hour = now.getHours()
            const isAuthorizedHour = hour >= 6 && hour <= 22

            if (!isAuthorizedHour) {
              // Create security alert
              await supabase.from('alertes').insert({
                station_id: station.id,
                entreprise_id: station.entreprise_id,
                type: 'securite',
                niveau: 'critique',
                message: `ALERTE SÉCURITÉ: Ouverture non autorisée détectée - Station ${station.nom} à ${now.toLocaleTimeString('fr-FR')}`
              })

              results.push({
                station_code: data.station_code,
                sensor_type: data.sensor_type,
                alert_created: true,
                status: 'security_alert'
              })
            } else {
              results.push({
                station_code: data.station_code,
                sensor_type: data.sensor_type,
                status: 'logged_authorized'
              })
            }
          }
        }
        else if (data.sensor_type === 'debit') {
          // Débitmètre - Log flow data for fraud detection
          // Compare with pump sales data (future feature)
          results.push({
            station_code: data.station_code,
            sensor_type: data.sensor_type,
            valeur: data.valeur,
            status: 'logged'
          })
        }
        else if (data.sensor_type === 'temperature') {
          // Temperature monitoring
          if (data.valeur > 45) { // Safety threshold
            await supabase.from('alertes').insert({
              station_id: station.id,
              entreprise_id: station.entreprise_id,
              type: 'securite',
              niveau: 'critique',
              message: `ALERTE TEMPÉRATURE: ${data.valeur}°C détecté - Station ${station.nom}`
            })
          }
          results.push({
            station_code: data.station_code,
            sensor_type: data.sensor_type,
            valeur: data.valeur,
            status: 'logged'
          })
        }
      } catch (err) {
        errors.push({ 
          station_code: data.station_code, 
          error: err instanceof Error ? err.message : String(err) 
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('IoT sensor error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
