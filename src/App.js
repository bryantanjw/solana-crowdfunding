import { React, useEffect, useState, useCallback, useMemo } from "react";
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Grid,
  theme,
  Heading,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import * as web3 from "@solana/web3.js";
import { ColorModeSwitcher } from "./ColorModeSwitcher";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import Card from './components/Card';
import Form from './components/Form';
import { getAllCampaigns } from "./solana";
import {
  WalletDisconnectButton,
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import Footer from "./components/Footer";
require("@solana/wallet-adapter-react-ui/styles.css");


function useSolanaAccount() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const init = useCallback(async () => {
    if (publicKey) {
      // get account info from the network
      let acc = await connection.getAccountInfo(publicKey);
      setAccount(acc);
      let transactions = await connection.getConfirmedSignaturesForAddress2(
        publicKey,
        {
          limit: 10,
        }
      );
      setTransactions(transactions);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (publicKey) {
      setInterval(init, 1000);
    }
  }, [init, publicKey]);

  // updating logic here
  return { account, transactions };
};

function WalletNotConnected() {
  return (
    <VStack height="70vh" justify="space-around">
      <VStack>
        <Text fontSize="2xl">
          {" "}
          Looks like your wallet is not connnected. Connect a wallet to get started!
        </Text>
        <WalletMultiButton />
      </VStack>
    </VStack>
  );
}

function Home() {
    // States
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { account } = useSolanaAccount();
  const [route, setRoute] = useState(0);
  const [cards, setCards] = useState([]);
  
  useEffect(() => {
    getAllCampaigns(connection).then((val) => {
      setCards(val);
      console.log(val);
    });
  }, []);

  return (
    <Box textAlign="center" fontSize="xl">
      <Grid minH="100vh" p={20}>
        <Tabs variant="soft-rounded" colorScheme="purple">
          <TabList width="full" mb={10}>
            <HStack justify="space-between" width="full">
              <HStack>
                <Tab>Discover</Tab>
                <Tab>Start a campaign</Tab>
              </HStack>
              <HStack>
                {publicKey && <WalletDisconnectButton bg="green" />}
                <ColorModeSwitcher justifySelf="flex-end" />
              </HStack>
            </HStack>
          </TabList>
          <TabPanels>
            <TabPanel>
              {publicKey && (
                <Box>
                  <VStack width={80} spacing={8} borderRadius={10} borderWidth={2} p={10}>
                    <FormControl id="pubkey">
                      <FormLabel>Wallet Public Key:</FormLabel>
                      <Input type="text" value={publicKey.toBase58()} readOnly/>
                    </FormControl>
                    <FormControl id="balance">
                      <FormLabel>Balance</FormLabel>
                      <Input 
                        type="text" 
                        value={account 
                          ? account.lamports / web3.LAMPORTS_PER_SOL
                          : 'Loading..'
                        }
                        readOnly
                      />
                    </FormControl>
                  </VStack>
                  <VStack mt={10}>
                    <Heading>Discover</Heading>
                      {/* Mobile responsive grid */}
                      {/* Passing `columns={[2, null, 3]}` is same as `columns={{sm: 2, md: 3}}` */}
                      <SimpleGrid columns={[1,null,2]} spacing={12}>
                        {cards.map((e, idx) => (
                          <Card
                            key={e.pubId.toString()}
                            data={{
                              title: e.name,
                              description: e.description,
                              amount: (e.amount_donated).toString(),
                              image: e.image_link,
                              id: e.pubId,
                              admin: e.admin,
                            }}
                            setCards={setCards} />
                        ))}
                      </SimpleGrid>
                  </VStack>
                </Box>
              )}
              {!publicKey && <WalletNotConnected />}
            </TabPanel>
            
            <TabPanel>
              {publicKey && (
                <VStack spacing={8}>
                  <Heading>Start a campaign</Heading>
                    <Form setRoute={(e) => {
                      setRoute(e);
                      getAllCampaigns(connection).then((val) => {
                        setCards(val);
                      });
                    }} />
                </VStack>
              )}
              {!publicKey && <WalletNotConnected />}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Grid>
    </Box>
  );
}

function App() {
  const opts = {
    preflightCommitment: "processed"
  }
  const network = "devnet";
  const endpoint = web3.clusterApiUrl(network);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ChakraProvider theme={theme}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Home></Home>
            <Footer/>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ChakraProvider>
  );
}

export default App;