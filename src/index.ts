const chalk = require("chalk");

import connectDB from "./config/db";
import LedgerUpdate from "./models/LedgerUpdate";
import User from "./models/User";
import {
  fetchModifiedUsers,
  manager,
  createDiscourseIdentity,
  createGithubIdentity,
} from "./utils";

const main = async (): Promise<void> => {
  await connectDB();
  const modifiedUsers = await fetchModifiedUsers();

  if (!modifiedUsers.length) {
    console.log(chalk.yellow("No recent modified users found, exitting..."));
    process.exit();
  }

  await manager.reloadLedger();
  const ledger = manager.ledger;

  const runStartTime = Date.now();

  console.log(
    `${new Date()}. Attempting to update ledger entries for users: \n- ${modifiedUsers
      .map((user) => user.username)
      .join("\n- ")}`
  );

  for (const user of modifiedUsers) {
    // Start of Ledger modifications logic
    const { discordId, username, address } = user;
    let { discourse, github } = user;
    console.log(`\nChecking ledger entry for ${username}...`);

    // Find account by Discord ID
    console.log(ledger.accountByName("hz"));
    const discordAccount = ledger.accountByAddress(
      `N\u0000sourcecred\u0000discord\u0000MEMBER\u0000user\u0000${discordId}\u0000`
    );

    if (!discordAccount) {
      console.log(
        chalk.yellow(
          `  - Cannot find Discord identity for user ${username}, skipping to next user`
        )
      );
      // User.findOneAndUpdate({ discordId }, { modifiedAt: Date.now() });
      return;
      continue;
    }

    const discordIdentityId = discordAccount.identity.id;
    // Regex to test invalid characters in Discourse and GitHub usernames
    const regex = /[._]/g;

    // Merge Discourse identity if specified
    if (discourse) {
      if (regex.test(discourse)) {
        console.log(
          `  - ${discourse}: Invalid Discourse name for identity, replacing...`
        );
        discourse = discourse.replace(regex, "-");
        console.log(`  - New Discourse name: ${discourse}`);
      }

      const discourseAccount = ledger.accountByAddress(
        `N\u0000sourcecred\u0000discourse\u0000user\u0000https://forum.1hive.org\u0000${discourse}\u0000`
      );

      let discourseIdentityId;
      if (discourseAccount) discourseIdentityId = discourseAccount.identity.id;
      else {
        console.log(
          `  - Could not find a Discourse identity for ${discourse}, created a new one`
        );
        discourseIdentityId = createDiscourseIdentity(discourse, ledger);
      }

      if (discordIdentityId !== discourseIdentityId) {
        try {
          ledger.mergeIdentities({
            base: discordIdentityId,
            target: discourseIdentityId,
          });
          console.log(
            `  - Merged Discourse identity ${discourse} into Discord identity ${username}`
          );
        } catch (err) {
          console.log(
            chalk.red(
              `  - An error occurred when trying to merge Discourse identity ${discourse} into Discord identity ${username}: ${err}`
            )
          );
          // User.findOneAndUpdate({ discordId }, { modifiedAt: Date.now() });
        }
      }
    }

    // Merge GitHub identity if specified
    if (github) {
      if (regex.test(github)) {
        console.log(
          `  - ${github}: Invalid GitHub name for identity, replacing...`
        );
        github = github.replace(regex, "-");
        console.log(`  - New GitHub name: ${github}`);
      }

      const githubAccount = ledger.accountByAddress(
        `N\u0000sourcecred\u0000github\u0000USERLIKE\u0000USER\u0000${github}\u0000`
      );

      let githubIdentityId;
      if (githubAccount) githubIdentityId = githubAccount.identity.id;
      else {
        console.log(
          `  - Could not find a GitHub identity for ${github}, created a new one`
        );
        githubIdentityId = createGithubIdentity(github, ledger);
      }

      if (discordIdentityId !== githubIdentityId) {
        try {
          ledger.mergeIdentities({
            base: discordIdentityId,
            target: githubIdentityId,
          });
          console.log(
            `  - Merged GitHub identity ${github} into Discord identity ${username}`
          );
        } catch (err) {
          console.log(
            chalk.red(
              `  - An error occurred when trying to merge GitHub identity ${github} into Discord identity ${username}: ${err}`
            )
          );
          // User.findOneAndUpdate({ discordId }, { modifiedAt: Date.now() });
        }
      }
    }

    // Add wallet address
    if (
      !discordAccount.payoutAddresses.size ||
      discordAccount.payoutAddresses.values().next().value !== address
    ) {
      ledger.setPayoutAddress(
        discordAccount.identity.id,
        address,
        "137",
        "0x0000000000000000000000000000000000000000"
      );
    }

    // Activate account
    // if (!discordAccount.active) {
    //   try {
    //     ledger.activate(discordIdentityId);
    //     console.log(`  - Discord identity for user ${username} activated`);
    //   } catch (err) {
    //     console.log(
    //       chalk.red(
    //         `  - An error occurred when trying to activate Discord identity for user ${discourse}: ${err}`
    //       )
    //     );
    //   }
    // }
    // End of Ledger modifications logic
    User.findOneAndUpdate({ discordId }, { modifiedAt: Date.now() });
  }

  const persistRes = await manager.persist();

  if (persistRes.error) {
    console.log(
      chalk.red(
        `\nAn error occurred when trying to commit the new ledger: ${persistRes.error}`
      )
    );
    process.exit(1);
  } else {
    await LedgerUpdate.create({ modifiedAt: runStartTime });
    console.log(chalk.green("\nAccounts successfully modified"));
    process.exit();
  }
};

main();
