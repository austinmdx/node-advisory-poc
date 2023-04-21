// supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

console.log('supabaseUrl:', supabaseUrl);
console.log('supabaseKey:', supabaseKey);

export const supabaseServer = createClient(supabaseUrl, supabaseKey);
