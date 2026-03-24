import { LinkedInPublishResult } from './types'

export async function publishTextPost(
  accessToken: string,
  personUrn: string,
  text: string,
  visibility: string = 'PUBLIC'
): Promise<LinkedInPublishResult> {
  const linkedinVisibility =
    visibility === 'CONNECTIONS' ? 'CONNECTIONS' : 'PUBLIC'

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
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
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
