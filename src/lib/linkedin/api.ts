import { LinkedInPublishResult } from './types'

export async function publishTextPost(
  accessToken: string,
  personUrn: string,
  text: string,
  visibility: string = 'PUBLIC',
  imageUrl?: string | null
): Promise<LinkedInPublishResult> {
  const linkedinVisibility =
    visibility === 'CONNECTIONS' ? 'CONNECTIONS' : 'PUBLIC'

  // If there's an image, upload it to LinkedIn first
  let mediaAsset: string | null = null
  if (imageUrl) {
    try {
      mediaAsset = await uploadImageToLinkedIn(accessToken, personUrn, imageUrl)
    } catch (err) {
      console.error('Image upload failed:', err)
      // Continue without image rather than failing the whole post
    }
  }

  const shareContent: Record<string, unknown> = {
    shareCommentary: { text },
    shareMediaCategory: mediaAsset ? 'IMAGE' : 'NONE',
  }

  if (mediaAsset) {
    shareContent.media = [
      {
        status: 'READY',
        media: mediaAsset,
      },
    ]
  }

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': shareContent,
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': linkedinVisibility,
      },
    }),
  })

  if (response.status === 201) {
    const postUrn = response.headers.get('X-RestLi-Id')
    return { success: true, postUrn: postUrn || undefined }
  }

  const error = await response.json().catch(() => ({ message: response.statusText }))
  return { success: false, error }
}

async function uploadImageToLinkedIn(
  accessToken: string,
  ownerUrn: string,
  imageUrl: string
): Promise<string> {
  // Step 1: Register the upload
  const registerResponse = await fetch(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: ownerUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }),
    }
  )

  if (!registerResponse.ok) {
    const err = await registerResponse.text()
    throw new Error(`Register upload failed: ${err}`)
  }

  const registerData = await registerResponse.json()
  const uploadUrl =
    registerData.value.uploadMechanism[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ].uploadUrl
  const asset = registerData.value.asset

  // Step 2: Download the image from Supabase Storage
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from storage: ${imageResponse.status}`)
  }
  const imageBuffer = await imageResponse.arrayBuffer()

  // Step 3: Upload the image binary to LinkedIn
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  })

  if (!uploadResponse.ok && uploadResponse.status !== 201) {
    const err = await uploadResponse.text()
    throw new Error(`Image upload to LinkedIn failed: ${err}`)
  }

  return asset
}
