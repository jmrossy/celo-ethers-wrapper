# Contributing

Thank you for your interest in improving the celo-ethers-wrapper.

This guide is intended to help you get started with contributing. By following these steps, you will
understand the development process and workflow.

### Cloning the repository

To start contributing to the project, fork it and clone it to your local machine using git:

```sh
$ git clone https://github.com/jmrossy/celo-ethers-wrapper.git
```

Navigate to the project's root directory:

```sh
$ cd celo-ethers-wrapper
```

### Installing Node.js

We use [Node.js](https://nodejs.org/en/) to run the project locally. You need to install the
**Node.js version** specified in [package.json > engines > node](/package.json). To do so, run:

```sh
$ nvm install <specified-version>
$ nvm use <specified-version>
```

### Installing dependencies

Once in the project's root directory, run the following command to install the project's
dependencies:

```sh
$ yarn install
```

After installing the dependencies, the project is ready to be run.

### Running the test suite

1.  Create an `.env.test.local` file:

    ```sh
    $ cp tests/.env.test.example tests/.env.test.local
    ```

2.  Generate a brand new wallet (or use an existing development wallet of yours) and paste its
    mnemonic phrase into `.env.test.local`:

    ```txt
    MNEMONIC='<PASTE YOUR MNEMONIC PHRASE HERE>'
    ```

3.  Ensure the wallet address has at least [X] CELO on the Celo Alfajores testnet. If you need more, you can request testnet CELO from [faucet.celo.org](https://faucet.celo.org/alfajores)

4.  Now you're ready to run tests with:

    ```sh
    $ yarn test
    ```

> **INFO** Some tests are run automatically when you open a Pull Request on GitHub.

### Open a Pull Request

✅ Now you're ready to contribute to celo-ethers-wrapper!
