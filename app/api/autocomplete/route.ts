import { NextRequest, NextResponse } from 'next/server'

const KAYAK_URL = 'https://www.il.kayak.com/mvm/smartyv2/search'

export async function GET(request: NextRequest) {
  const where = request.nextUrl.searchParams.get('where')
  if (!where || where.length < 3) {
    return NextResponse.json({ error: 'where param missing or too short' }, { status: 400 })
  }

  try {
    const upstream = `${KAYAK_URL}?f=j&s=car&where=${encodeURIComponent(where)}`
    const res = await fetch(upstream, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; car-rental-search/1.0)',
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
  }
}
