# pollen-onboarding

A script to add, merge and activate new users in the Pollen instance.

## Developer setup

### Install dependencies

`npm install`, `npm install -D`

### Add env variables

Copy the content of your `.env.sample` file into a new `.env` file and add the corresponding variables:

- `MONGODB_URI` = Your MongoDB connection URI.
- `GH_API_TOKEN` = GitHub token with commit permissions to the repo.
- `REPO` = The repo you want to commit to.
- `BRANCH` = The branch you want to commit to.

### Run the script!

- `npm start` will execute the script in production mode.
- `npm run dev` will execute the script in developer mode, with hot reloading.
