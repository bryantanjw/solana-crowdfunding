// Import `solana_program` crate
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};

// Import from the Borsh Crate
use borsh::{BorshDeserialize, BorshSerialize};


// Every solana program has one entry point takes in program_id, accounts, instruction_data as parameters
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    // The data to process the instruction is a list of 8 bitunsigned integers
    instruction_data: &[u8],
    
) -> ProgramResult {
    // Check if instruction_data len is greater than 0, if it is, do not procced
    if instruction_data.len() == 0 {
        return Err(ProgramError::InvalidInstructionData);
    }

    // Entry points to call the each function
    // 0 for create_campaign
    if instruction_data[0] == 0 {
        return create_campaign(
            program_id,
            accounts,
            // Omit the first element in calling functions
            &instruction_data[1..instruction_data.len()],
        )
    // 1 for withdraw
    } else if instruction_data[0] == 1 {
        return withdraw(
            program_id,
            accounts,
            &instruction_data[1..instruction_data.len()],
        );
    // 2 for donate
    } else if instruction_data[0] == 2 {
        return donate(
            program_id,
            accounts,
            &instruction_data[1..instruction_data.len()],
        )
    }

    // If instruction_data doesn't match, throw an error
    msg!("Didn't find the entrypoint required");
    Err(ProgramError::InvalidInstructionData)
}

// Call the entry point macro to add `process_instruction` as the entry point to the program
entrypoint!(process_instruction);

// CampaignDetails Struct
#[derive(BorshSerialize, BorshDeserialize, Debug)]
struct CampaignDetails {
    pub admin: Pubkey,
    pub name: String,
    pub description: String,
    pub image_link: String,
    pub amount_donated: u64,
}

fn create_campaign(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    // Writing account is same as program account
    let writing_account = next_account_info(accounts_iter)?;

    // Account of the person creating the campaign
    let creator_account = next_account_info(accounts_iter)?;

    // To allow transactions, the creator account need to sign the transaction
    if !creator_account.is_signer {
        msg!("creator_account should be signer");
        return Err(ProgramError::IncorrectProgramId);
    }
    if writing_account.owner != program_id {
        msg!("writing_account isn't owned by program");
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut input_data = CampaignDetails::try_from_slice(&instruction_data)
        .expect("Instruction data serialization didn't work");
    
    // For the campaign created, only the admin should be the one who created it
    if input_data.admin != *creator_account.key {
        msg!("Invalid instruction data");
        return Err(ProgramError::InvalidInstructionData);
    }

    let rent_exemption = Rent::get()?.minimum_balance(writing_account.data_len());
    // Make sure the program account (`writing_account`) has that much lamports(balance).
    if **writing_account.lamports.borrow() < rent_exemption {
        msg!("The balance of writing_account should be more than rent exemption");
        return Err(ProgramError::InsufficientFunds);
    }
    // Set the initial amount donate to be zero.
    input_data.amount_donated = 0;

    input_data.serialize(&mut &mut writing_account.data.borrow_mut()[..])?;
    Ok(())
}


#[derive(BorshSerialize, BorshDeserialize, Debug)]
struct WithdrawRequest {
    pub amount: u64,
}

fn withdraw(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let writing_account = next_account_info(accounts_iter)?;
    let admin_account = next_account_info(accounts_iter)?;

    // Check if the writing account is owned by program
    if writing_account.owner != program_id {
        msg!("writing_account isn't owned by program");
        return Err(ProgramError::IncorrectProgramId);
    }
    // Admin account should be the signer in this trasaction
    if !admin_account.is_signer {
        msg!("admin should be signer");
        return Err(ProgramError::IncorrectProgramId);
    }

    let campaign_data = CampaignDetails::try_from_slice(*writing_account.data.borrow())
        .expect("Error deserializing data");
    
    // Check if the admin_account's public key is equal to
    // the public key stored in campaign_data.
    if campaign_data.admin != *admin_account.key {
        msg!("Only the account admin can withdraw");
        return Err(ProgramError::InvalidAccountData);
    }

    // Get the amount of lamports admin wants to withdraw
    let input_data = WithdrawRequest::try_from_slice(&instruction_data)
        .expect("Instruction data serialization didn't work");

    let rent_exemption = Rent::get()?.minimum_balance(writing_account.data_len());

    // Check if there's enough funds
    if **writing_account.lamports.borrow() - rent_exemption < input_data.amount {
        msg!("Insufficient balance");
        return Err(ProgramError::InsufficientFunds);
    }

    // Transfer balance
    // Decrease the balance of the program account, and increase the admin_account balance.
    **writing_account.try_borrow_mut_lamports()? -= input_data.amount;
    **admin_account.try_borrow_mut_lamports()? += input_data.amount;
    Ok(())
}

fn donate(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let writing_account = next_account_info(accounts_iter)?;
    let donator_program_account = next_account_info(accounts_iter)?;
    let donator = next_account_info(accounts_iter)?;

    if writing_account.owner != program_id {
        msg!("writing_account isn't owned by program");
        return Err(ProgramError::IncorrectProgramId);
    }
    if donator_program_account.owner != program_id {
        msg!("donator_program_account isn't owned by program");
        return Err(ProgramError::IncorrectProgramId);
    }
    if !donator.is_signer {
        msg!("donator should be signer");
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut campaign_data = CampaignDetails::try_from_slice(*writing_account.data.borrow())
        .expect("Error deserializing data");

    // increment the amount_donated
    campaign_data.amount_donated += **donator_program_account.lamports.borrow();
    // Then do the actual transaction.
    **writing_account.try_borrow_mut_lamports()? += **donator_program_account.lamports.borrow();
    **donator_program_account.try_borrow_mut_lamports()? = 0;

    // Write the new updated campaign_data to the writing_account's data field 
    campaign_data.serialize(&mut &mut writing_account.data.borrow_mut()[..])?;

    Ok(())
}