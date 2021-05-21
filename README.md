# pollen-onboarding

A script to add, merge and activate new users in the ledger every 6 hours

## Developer setup

### Install dependencies

`npm install`, `npm install -D`

### Add env variables

Copy the content of your `.env.sample` file into a new `.env` file and add the corresponding variables:

- `REPO_AND_BRANCH` = The repo and branch of your sourcecred instance. In this case it's `https://raw.githubusercontent.com/1Hive/pollen/gh-pages/`
- `MONGODB_URI` = Your MongoDB connection URI.
- `GITHUB_API_TOKEN` = GitHub token with commit permissions to the repo.
- `REPO` = The repo you want to commit to.
- `BRANCH` = The branch you want to commit to.

### Run the script!

- `npm run dev` will execute the script in developer mode, with hot reloading.
- `npm start` will execute the script in production mode.
