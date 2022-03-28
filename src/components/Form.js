import { useState } from "react";
import { createCampaign } from "../solana";
import { Box, VStack, Button, FormControl, FormLabel, Input, FormHelperText, Textarea } from "@chakra-ui/react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

const Form = ({setRoute}) => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [image, setImageLink] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault();
        await createCampaign(wallet, connection, name, description, image);
        setName('');
        setDescription('');
        setImageLink('');
    };

    return (
        <Box minH="60vh" w="100%">
            <VStack spacing={8} p={9} borderRadius={10} borderWidth={2}>
                <FormControl isRequired>
                    <FormLabel htmlFor='title'>Campaign Title</FormLabel>
                    <Input id='title' type='text' onChange={(e) => setName(e.target.value)} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel htmlFor='desciption'>Description</FormLabel>
                    <Textarea resize={'none'} maxLength={250} id='description' type='text' onChange={(e) => setDescription(e.target.value)} />
                    <FormHelperText textAlign="left">Tell the world what your campaign is about!</FormHelperText>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel htmlFor='imageLink'>Image Link</FormLabel>
                    <Input id='image-link' type='text' onChange={(e) => setImageLink(e.target.value)} />
                </FormControl>
                <Button onClick={onSubmit}>Publish! 👏</Button>
            </VStack>
        </Box>
    );
}

export default Form;