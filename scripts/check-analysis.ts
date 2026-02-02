
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMeeting(id: string) {
  const { data, error } = await supabase
    .from('analysis')
    .select('*')
    .eq('meeting_id', id)
    .single()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('--- ANALYSIS DATA ---')
    console.log(JSON.stringify(data, null, 2))
  }
}

const meetingId = '594faa87-6c6e-431c-b01f-c52dbb3c1564'
checkMeeting(meetingId)
