import connectDB from './config/db'
import LedgerUpdate from './models/LedgerUpdate'
import User from './models/User'
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

  const runStartTime = Date.now()

  log(`Attempting to update ledger entries for users: \n- ${
    modifiedUsers.map(user => user.username).join('\n- ')
  }`)
  
  for (const user of modifiedUsers) {
    // Start of Ledger modifications logic
    const { discordId, username, discourse, github } = user
    log(`Checking ledger entry for ${username}`)

    const discordAccount = ledger.accountByAddress(
      `N\u0000sourcecred\u0000discord\u0000MEMBER\u0000user\u0000${discordId}\u0000`
    )

    if (!discordAccount) {
      log(`Cannot find Discord identity for user ${username}, skipping to next user...`)
      User.findOneAndUpdate({ discordId }, { modifiedAt: Date.now() })
      continue
    }

    const discordIdentityId = discordAccount.identity.id

    if (discourse) {
      const discourseAccount = ledger.accountByAddress(
        `N\u0000sourcecred\u0000discourse\u0000user\u0000https://forum.1hive.org\u0000${discourse}\u0000`
      )

      let discourseIdentityId
      if (discourseAccount) discourseIdentityId = discourseAccount.identity.id
      else {
        log(`Could not find a Discourse identity for ${discourse}, creating a new Discourse identity...`)
        discourseIdentityId = createDiscourseIdentity(discourse, ledger)
      }

      if (discordIdentityId !== discourseIdentityId) {
        try {
          ledger.mergeIdentities({ base: discordIdentityId, target: discourseIdentityId })
          log(`Merged Discourse identity ${discourse} into Discord identity ${username}`)
        } catch (err) {
          log(`An error occurred when trying to merge Discourse identity ${discourse} into Discord identity ${username}: ${err}`)
          User.findOneAndUpdate({ discordId }, { modifiedAt: Date.now() })
        }
      }
    }

    if (github) {
      const githubAccount = ledger.accountByAddress(
        `N\u0000sourcecred\u0000github\u0000USERLIKE\u0000USER\u0000${github}\u0000`
      )

      let githubIdentityId
      if (githubAccount) githubIdentityId = githubAccount.identity.id
      else {
        log(`Could not find a GitHub identity for ${github}, creating a new GitHub identity...`)
        githubIdentityId = createGithubIdentity(github, ledger)
      }

      if (discordIdentityId !== githubIdentityId) {
        try {
          ledger.mergeIdentities({ base: discordIdentityId, target: githubIdentityId })
          log(`Merged GitHub identity ${github} into Discord identity ${username}`)
        } catch (err) {
          log(`An error occurred when trying to merge GitHub identity ${github} into Discord identity ${username}: ${err}`)
          User.findOneAndUpdate({ discordId }, { modifiedAt: Date.now() })
        }
      }
    }
  
    ledger.activate(discordIdentityId)
    // End of Ledger modifications logic
  }
  
  const persistRes = await manager.persist()
  
  if(persistRes.error) log(`An error occurred when trying to commit the new ledger: ${persistRes.error}`)
  else {
    await LedgerUpdate.create({ modifiedAt: runStartTime })
    log('Accounts successfully modified')
  }
}

main()
