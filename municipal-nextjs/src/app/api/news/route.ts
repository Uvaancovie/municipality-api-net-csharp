import { NextRequest, NextResponse } from 'next/server'

interface MediaStackArticle {
  author: string
  title: string
  description: string
  url: string
  source: string
  image: string
  category: string
  language: string
  country: string
  published_at: string
}

interface MediaStackResponse {
  pagination: {
    limit: number
    offset: number
    count: number
    total: number
  }
  data: MediaStackArticle[]
}

// Convert MediaStack article to our NewsArticle format
function convertToNewsArticle(article: MediaStackArticle) {
  return {
    title: article.title,
    description: article.description,
    url: article.url,
    urlToImage: article.image,
    publishedAt: article.published_at,
    source: {
      name: article.source
    },
    content: article.description
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.MEDIASTACK_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'MediaStack API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.mediastack.com/v1/news?access_key=${apiKey}&countries=za&limit=12&sort=published_desc`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`MediaStack API error: ${response.statusText}`)
    }

    const data: MediaStackResponse = await response.json()
    
    // Convert MediaStack format to our NewsArticle format
    const articles = data.data.map(convertToNewsArticle)

    return NextResponse.json({
      status: 'ok',
      totalResults: data.pagination.total,
      articles: articles
    })

  } catch (error: any) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news', details: error.message },
      { status: 500 }
    )
  }
}
