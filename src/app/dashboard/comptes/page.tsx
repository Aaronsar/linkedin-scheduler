import { createClient } from '@/lib/supabase/server'
import { Plus, AlertTriangle, Trash2 } from 'lucide-react'
import { revalidatePath } from 'next/cache'

async function disconnectAccount(formData: FormData) {
  'use server'
  const accountId = formData.get('accountId') as string
  const supabase = await createClient()
  await supabase.from('linkedin_accounts').delete().eq('id', accountId)
  revalidatePath('/dashboard/comptes')
}

export default async function ComptesPage() {
  const supabase = await createClient()
  const { data: accounts } = await supabase
    .from('linkedin_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comptes LinkedIn</h1>
        <a
          href="/api/linkedin/authorize"
          className="inline-flex items-center gap-2 bg-[#0a66c2] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#004182] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Connecter un compte
        </a>
      </div>

      {accounts && accounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const isExpiring =
              new Date(account.token_expires_at) <
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            const isExpired = new Date(account.token_expires_at) < new Date()

            return (
              <div
                key={account.id}
                className="bg-white rounded-xl border p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  {account.linkedin_picture_url ? (
                    <img
                      src={account.linkedin_picture_url}
                      alt={account.linkedin_name || ''}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#0a66c2] flex items-center justify-center text-white font-bold text-lg">
                      {(account.linkedin_name || '?')[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{account.linkedin_name || 'Compte LinkedIn'}</p>
                    <p className="text-sm text-gray-500">{account.linkedin_email || ''}</p>
                  </div>
                </div>

                {isExpired ? (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    Token expire - veuillez reconnecter
                  </div>
                ) : isExpiring ? (
                  <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    Expire bientot
                  </div>
                ) : (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                    Connecte - expire le{' '}
                    {new Date(account.token_expires_at).toLocaleDateString('fr-FR')}
                  </div>
                )}

                <div className="flex gap-2">
                  {(isExpired || isExpiring) && (
                    <a
                      href="/api/linkedin/authorize"
                      className="flex-1 text-center text-sm bg-[#0a66c2] text-white py-2 rounded-lg hover:bg-[#004182] transition-colors"
                    >
                      Reconnecter
                    </a>
                  )}
                  <form action={disconnectAccount}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-[#0a66c2]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun compte connecte</h3>
          <p className="text-gray-500 mb-6">
            Connectez votre premier compte LinkedIn pour commencer a programmer des posts.
          </p>
          <a
            href="/api/linkedin/authorize"
            className="inline-flex items-center gap-2 bg-[#0a66c2] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#004182] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Connecter un compte LinkedIn
          </a>
        </div>
      )}
    </div>
  )
}
