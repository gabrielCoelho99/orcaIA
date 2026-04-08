import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Nenhum token fornecido' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Initialize Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    });

    const preference = new Preference(client);

    // Ensure we have a valid site URL for the back_url
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    if (siteUrl.startsWith('http://localhost') || siteUrl.includes('192.168.')) {
      // Mercado Pago PreApproval/Preference rejects local URLs in some strict contexts, but Preference usually allows it.
      // However to be safe with testing we provide a valid dummy
      siteUrl = 'https://meu-app.vercel.app';
    }

    // We assume the user has a linked company profile. For this example we just use the user ID.
    const company_id = user.id;

    // Create the Preference for Checkout Pro
    const response = await preference.create({
      body: {
        items: [
          {
            id: 'orcaia_pro_1m_promo',
            title: 'OrcaIA - Plano Profissional (Promoção - 3 primeiros meses)',
            quantity: 1,
            unit_price: 34.99,
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: user.email || 'contato@orcaia.com'
        },
        back_urls: {
          success: `${siteUrl}/dashboard/settings?checkout=success`,
          failure: `${siteUrl}/dashboard/settings?checkout=failure`,
          pending: `${siteUrl}/dashboard/settings?checkout=pending`
        },
        auto_return: 'approved',
        external_reference: company_id,
      }
    });

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point
    });

  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'cause' in error) {
      console.error('Erro detalhado no checkout:', (error as { cause: unknown }).cause);
    } else {
      console.error('Erro na criação do checkout:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
