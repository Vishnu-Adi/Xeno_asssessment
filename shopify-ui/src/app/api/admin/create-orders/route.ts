import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { resolveTenantIdFromShopDomain } from '@/lib/tenant'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const prisma = getPrisma()
  const body = await req.json()
  const { shop, count = 15 } = body
  
  if (!shop) {
    return NextResponse.json({ error: 'missing shop' }, { status: 400 })
  }

  const tenantId = await resolveTenantIdFromShopDomain(shop)
  
  try {
    // Get store access token
    const store = await prisma.store.findFirst({
      where: { shopDomain: shop },
      select: { accessToken: true }
    })

    if (!store?.accessToken) {
      return NextResponse.json({ error: 'No access token found for shop' }, { status: 400 })
    }

    // Get local customers for this tenant
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { shopifyCustomerId: true, email: true, firstName: true, lastName: true },
      take: 50
    })

    if (customers.length === 0) {
      return NextResponse.json({ error: 'No customers found. Create customers first.' }, { status: 400 })
    }

    // Get active product variants from Shopify
    const variantsResponse = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': store.accessToken,
      },
      body: JSON.stringify({
        query: `{
          products(first: 10, query: "status:active") {
            edges {
              node {
                id
                title
                variants(first: 5) {
                  edges {
                    node {
                      id
                      title
                      price
                      availableForSale
                    }
                  }
                }
              }
            }
          }
        }`
      })
    })

    if (!variantsResponse.ok) {
      const errorText = await variantsResponse.text()
      console.error('Shopify API error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch products', details: errorText }, { status: 500 })
    }

    const variantsData = await variantsResponse.json()
    console.log('Variants response:', JSON.stringify(variantsData, null, 2))
    
    if (variantsData.errors) {
      console.error('GraphQL errors:', variantsData.errors)
      return NextResponse.json({ error: 'GraphQL errors', details: variantsData.errors }, { status: 500 })
    }

    const variants = variantsData.data?.products?.edges?.flatMap((product: any) => 
      product.node.variants.edges
        .filter((variant: any) => variant.node.availableForSale)
        .map((variant: any) => variant.node)
    ) || []

    if (variants.length === 0) {
      return NextResponse.json({ error: 'No available product variants found' }, { status: 400 })
    }

    console.log(`Found ${variants.length} variants and ${customers.length} customers`)

    const createdOrders = []
    
    for (let i = 0; i < Math.min(count, 10); i++) { // Limit to 10 for safety
      try {
        // Pick random customer and variants
        const customer = customers[Math.floor(Math.random() * customers.length)]
        const variant = variants[Math.floor(Math.random() * variants.length)]
        const quantity = Math.floor(Math.random() * 2) + 1 // 1-2 quantity

        console.log(`Creating order ${i + 1} for customer ${customer.email} with variant ${variant.id}`)

        // Create draft order with simpler structure
        const draftMutation = `
          mutation draftOrderCreate($input: DraftOrderInput!) {
            draftOrderCreate(input: $input) {
              draftOrder {
                id
                totalPrice
              }
              userErrors {
                field
                message
              }
            }
          }
        `

        const draftVariables = {
          input: {
            customerId: `gid://shopify/Customer/${customer.shopifyCustomerId}`,
            lineItems: [{
              variantId: variant.id,
              quantity: quantity
            }],
            tags: ["seeded", "xeno"]
          }
        }

        const draftResponse = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': store.accessToken,
          },
          body: JSON.stringify({
            query: draftMutation,
            variables: draftVariables
          })
        })

        if (!draftResponse.ok) {
          console.error(`Draft creation failed with status ${draftResponse.status}`)
          continue
        }

        const draftData = await draftResponse.json()
        console.log(`Draft response for order ${i + 1}:`, JSON.stringify(draftData, null, 2))
        
        if (draftData.errors) {
          console.error('Draft GraphQL errors:', draftData.errors)
          continue
        }

        const draftOrder = draftData.data?.draftOrderCreate?.draftOrder
        const userErrors = draftData.data?.draftOrderCreate?.userErrors

        if (userErrors && userErrors.length > 0) {
          console.error('Draft user errors:', userErrors)
          continue
        }
        
        if (!draftOrder) {
          console.error('No draft order created')
          continue
        }

        // Complete the draft order
        const completeMutation = `
          mutation draftOrderComplete($id: ID!) {
            draftOrderComplete(id: $id) {
              draftOrder {
                order {
                  id
                  name
                  totalPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                  createdAt
                  customer {
                    id
                    email
                  }
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `

        const completeResponse = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': store.accessToken,
          },
          body: JSON.stringify({
            query: completeMutation,
            variables: { id: draftOrder.id }
          })
        })

        if (completeResponse.ok) {
          const completeData = await completeResponse.json()
          console.log(`Complete response for order ${i + 1}:`, JSON.stringify(completeData, null, 2))
          
          const order = completeData.data?.draftOrderComplete?.draftOrder?.order
          const completeErrors = completeData.data?.draftOrderComplete?.userErrors
          
          if (completeErrors && completeErrors.length > 0) {
            console.error('Complete user errors:', completeErrors)
            continue
          }
          
          if (order) {
            // Extract ID from GraphQL ID
            const orderId = order.id.replace('gid://shopify/Order/', '')
            
            createdOrders.push({
              shopifyOrderId: orderId,
              orderName: order.name,
              totalPrice: order.totalPriceSet.shopMoney.amount,
              customer: order.customer?.email,
              createdAt: order.createdAt
            })

            console.log(`Successfully created order: ${order.name}`)
          }
        }
        
        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to create order ${i + 1}:`, error)
      }
    }

    return NextResponse.json({
      message: `Created ${createdOrders.length} orders`,
      orders: createdOrders,
      debug: {
        customersFound: customers.length,
        variantsFound: variants.length
      }
    })
  } catch (error: any) {
    console.error('Order creation failed:', error)
    return NextResponse.json({ error: 'Failed to create orders', details: error.message }, { status: 500 })
  }
}
