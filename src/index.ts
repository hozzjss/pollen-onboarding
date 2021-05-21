import connectDB from './config/db'
import LedgerUpdate from './models/LedgerUpdate'
import { 
  fetchModifiedUsers, 
  manager, 
  createDiscourseIdentity, 
  createGithubIdentity,
  log
} from './utils'

const main = async (): Promise<void> => {
  await connectDB()
  const modifiedUsers = await fetchModifiedUsers()

  await manager.reloadLedger()
  const ledger = manager.ledger
  
  for (const user of modifiedUsers) {
    // Start of Ledger modifications logic
    const { discordId, username, discourse, github } = user
    log(`Updating ledger entry for ${username}`)

    const discordIdentityId = ledger
      .accountByAddress(`N\u0000sourcecred\u0000discord\u0000MEMBER\u0000user\u0000${discordId}\u0000`)
      .identity.id

    if (discourse) {
      const discourseAccount = ledger
        .accountByAddress(`N\u0000sourcecred\u0000discourse\u0000user\u0000https://forum.1hive.org\u0000${discourse}\u0000`)

      const discourseIdentityId = discourseAccount ? discourseAccount.identity.id : createDiscourseIdentity(discourse, ledger)

      if (discordIdentityId !== discourseIdentityId) {
        try {
          ledger.mergeIdentities({ base: discordIdentityId, target: discourseIdentityId })
          log(`Merged identity ${discourseIdentityId} into ${discordIdentityId}`)
        } catch (err) {
          log(`An error occurred when trying to merge identity ${discourseIdentityId} into ${discordIdentityId}: ${err}`)
        }
      }
    }

    if (github) {
      const githubAccount = ledger
        .accountByAddress(`N\u0000sourcecred\u0000github\u0000USERLIKE\u0000USER\u0000${github}\u0000`)

      const githubIdentityId = githubAccount ? githubAccount.identity.id : createGithubIdentity(github, ledger)

      if (discordIdentityId !== githubIdentityId) {
        try {
          ledger.mergeIdentities({ base: discordIdentityId, target: githubIdentityId })
          log(`Merged identity ${githubIdentityId} into ${discordIdentityId}`)
        } catch (err) {
          log(`An error occurred when trying to merge identity ${githubIdentityId} into ${discordIdentityId}: ${err}`)
        }
      }
    }
  
    ledger.activate(discordIdentityId)
    // End of Ledger modifications logic
  }
  
  const persistRes = await manager.persist()
  
  if(persistRes.error) log(`An error occurred when trying to commit the new ledger: ${persistRes.error}`)
  else {
    await LedgerUpdate.create({ modifiedAt: Date.now() })
    log('Accounts successfully modified')
  }
}

main()
