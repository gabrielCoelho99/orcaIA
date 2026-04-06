import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Esta rota será chamada pelo Mercado Pago
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook payload recebido:', body);

    const mpcAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!mpcAccessToken || !supabaseServiceUrl || !supabaseServiceKey) {
      console.error('Configurações de ambiente falhando no Webhook');
      return NextResponse.json({ error: 'Config errada' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken: mpcAccessToken });

    // Cliente raw para dar bypass no RLS. Necessário por ser um webhook s/ sessão
    const supabaseServerClient = createClient(supabaseServiceUrl, supabaseServiceKey);

    // Identificando atualização de pagamento (Checkout Pro)
    if (body.type === 'payment' || body.topic === 'payment' || body.action?.startsWith('payment')) {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return NextResponse.json({ success: true, message: 'Sem ID do pagamento' });
      }

      const paymentModule = new Payment(client);
      const payInfo = await paymentModule.get({ id: paymentId });

      const companyId = payInfo.external_reference;
      
      if (!companyId) {
         return NextResponse.json({ success: true, message: 'Sem company_id' });
      }

      if (payInfo.status === 'approved') {
        // Upgrade para PRO
        await supabaseServerClient.from('subscriptions').update({
          plan: 'pro',
          status: 'active',
          quotes_limit: 999999,
          services_limit: 999999
        }).eq('company_id', companyId);
        
      } else if (payInfo.status === 'rejected' || payInfo.status === 'refunded' || payInfo.status === 'cancelled') {
        // Fallback ou Cancelamento (opicional)
        await supabaseServerClient.from('subscriptions').update({
          plan: 'free',
          status: 'canceled', // Mantido canceled apenas se for estornado
          quotes_limit: 5,
          services_limit: 3
        }).eq('company_id', companyId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
