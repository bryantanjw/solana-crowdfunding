import { useState } from "react";
import { donateToCampaign, getAllCampaigns, withdraw } from "../solana";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
    Box,
    VStack,
    useColorModeValue,
    Heading,
    Text,
    Stack,
    Image,
    Button, FormHelperText, FormControl, 
    InputLeftElement, InputGroup, Input, InputLeftAddon,
    CircularProgress,
    useToast,
} from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react'

const SolanaLogo = (props) => (
    <Icon viewBox="0 0 397.7 311.7" {...props}>
      <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="360.879" y1="351.455" x2="141.213" y2="-69.294" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stopColor="#00ffa3"/>
        <stop offset="1" stopColor="#dc1fff"/>
        </linearGradient>
        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#a)"/>
        <linearGradient id="b" gradientUnits="userSpaceOnUse" x1="264.829" y1="401.601" x2="45.163" y2="-19.148" gradientTransform="matrix(1 0 0 -1 0 314)">
            <stop offset="0" stopColor="#00ffa3"/>
            <stop offset="1" stopColor="#dc1fff"/>
        </linearGradient>
        <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#b)"/>
        <linearGradient id="c" gradientUnits="userSpaceOnUse" x1="312.548" y1="376.688" x2="92.882" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)">
            <stop offset="0" stopColor="#00ffa3"/>
            <stop offset="1" stopColor="#dc1fff"/>
        </linearGradient>
        <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#c)"/>
    </Icon>
);

const Card = ({ data, setCards }) => {
    const [amount, setAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    
    const { connection } = useConnection();
    const wallet = useWallet();
    
    const onDonate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await donateToCampaign(wallet, connection, data.id, amount);
            let newCards = await getAllCampaigns(connection);
            setCards(newCards);
            toast({
                title: "Submitted!",
                description: "Your transaction has been confirmed. Thanks for funding the campaign!",
                status: "success",
                duration: 10000,
                isClosable: true,
                position: 'bottom-left',
                variant: 'left-accent',
                containerStyle: {
                    width: '550px',
                    paddingLeft: '50px',
                    paddingBottom: '35px',
                },
            });           
        } catch (error) {
            toast({
                title: "Error!",
                description: "Your transaction was not confirmed. Please try again.",
                status: "error",
                duration: 10000,
                isClosable: true,
                position: 'bottom-left',
                variant: 'left-accent',
                containerStyle: {
                    width: '550px',
                    paddingLeft: '50px',
                    paddingBottom: '35px',
                },
            });
        }
        setIsLoading(false);
        setAmount(null);
    };

    const onWithdraw = async (e) => {
        e.preventDefault();
        try {
            await withdraw(wallet, connection, data.id, amount);
            toast({
                title: "Funds withdrawn!",
                description: "Your transaction has been confirmed.",
                status: "success",
                duration: 10000,
                isClosable: true,
                position: 'bottom-left',
                variant: 'left-accent',
                containerStyle: {
                    minWidth: '550px',
                    paddingLeft: '50px',
                    paddingBottom: '35px',
                },
            });
        } catch (e) {
            console.log(e);
            toast({
                title: "Action not allowed!",
                description: "Only admins can withdraw.",
                status: "error",
                duration: 10000,
                isClosable: true,
                position: 'bottom-left',
                variant: 'left-accent',
                containerStyle: {
                    minWidth: '550px',
                    paddingLeft: '50px',
                    paddingBottom: '35px',
                },
            });
        }
        let newCards = await getAllCampaigns(connection);
        setCards(newCards);
        setAmount('');
    };

    const renderWithdrawContainer = () => {
        return (
            <form onSubmit={(e) => onWithdraw(e)}>
                <Stack direction={'row'} spacing={4}>
                    <FormControl isRequired>
                        <InputGroup size={'md'}>
                            <InputLeftElement pointerEvents='none' color='gray.300' fontSize='0.9em' children={<SolanaLogo />} />
                            <Input type='number' placeholder='Enter amount to withdraw' 
                                onChange={(e) => setAmount(e.target.value)} />
                        </InputGroup>
                    </FormControl>
                    <Button type="submit" mt={10} w={'200px'} bg={'purple.500'} color={'white'} size={'md'}
                        rounded={'xl'} 
                        _hover={{
                            transform: 'translateY(-2px)',
                            boxShadow:'0 5px 20px 0px rgb(131 59 156 / 43%)',
                        }}
                    >
                        Withdraw
                    </Button>
                </Stack>
            </form>
        );
    }
    

    return (
            <Box mt={12} role={'group'} p={6} bg={useColorModeValue('white', 'gray.800')}
                boxShadow={'2xl'} rounded={'lg'} pos={'relative'} zIndex={1}>
                <Box rounded={'lg'} mt={-12} pos={'relative'} height={'230px'} 
                    _after={{
                        transition: 'all .3s ease', content: '""',w: 'full',
                        h: 'full',
                        pos: 'absolute',
                        top: 5,
                        left: 0,
                        backgroundImage: `url(${data.image})`,
                        filter: 'blur(15px)',
                        zIndex: -1,
                    }}
                    _groupHover={{
                        _after: {
                            filter: 'blur(23px)',
                        },
                    }}>
                    <Image rounded={'lg'} height={'230px'} width={'full'}
                        objectFit={'cover'} src={data.image}
                    />
                </Box>
                <Stack mt={'45px'} textAlign='left' spacing={2}>
                    <Heading fontSize={'2xl'} fontFamily={'body'} fontWeight={650}>
                        {data.title}
                    </Heading>
                    <Text color={'black.500'} fontSize={'md'}>
                        {data.description}
                    </Text>
                    <form onSubmit={(e) => onDonate(e)}>
                        <Stack mb={4} mt={4} direction={'row'} spacing={4}>
                            <FormControl isRequired>
                                <InputGroup size={'md'}>
                                    <InputLeftElement pointerEvents='none' color='gray.300' fontSize='0.9em' children={<SolanaLogo />} />
                                    <Input type='number' placeholder='Enter amount of lamports' 
                                        onChange={(e) => setAmount(e.target.value)} />
                                </InputGroup>
                            </FormControl>
                            <Button type="submit" mt={10} w={'200px'} bg={'purple.500'} color={'white'} size={'md'}
                                rounded={'xl'} 
                                _hover={{
                                    transform: 'translateY(-2px)',
                                    boxShadow:'0 5px 20px 0px rgb(131 59 156 / 43%)',
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress isIndeterminate size="24px" color="purple.500" />
                                    ) : (
                                        'Fund'
                                )}
                            </Button>
                        </Stack>
                    </form>
                        <Text textColor='gray.600' fontWeight={600} fontSize={'lg'} bg='gray.200' 
                            w={'50%'} px={3} py={1} borderRadius={10} borderWidth={2}>
                            {data.amount} Lamports raised
                        </Text>

                    {/* Only display withdraw form if wallet publickey equals campaignkey */}
                    {wallet.publicKey.toBuffer().every(function(element, index) {
                        return element === data.admin[index]; 
                    }) && renderWithdrawContainer()
                    }
                </Stack>
            </Box>
    );
}

export default Card;
  