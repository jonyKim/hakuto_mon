import { AppDataSource } from './database';
import { ethers } from 'ethers';
import { createGuildClient, createSigner } from '@guildxyz/sdk';

// Guild 설정
const GUILD_CONFIG = {
    guildId: 94039,
    roleId: 174650, // TEST Hakuto role
    allowlistRequirementId: 473466, // allowlist requirement ID
    creatorAddress: '0xd916430a0406eb6bd48873c48f06e628d0142aeb'
};

async function initializeDatabase() {
    try {
        await AppDataSource.initialize();
        console.log('[mysql] Database connection initialized successfully');
    } catch (error) {
        console.error('[mysql] Error during database initialization:', error);
        throw error;
    }
}

async function fetchStakingInfo() {
    try {
        const query = `
            SELECT DISTINCT
                own_waletaddress AS user_wallet,
                contract_address,
                token_id,
                admin_waletaddress
            FROM
                tb_user_nft_stake
            WHERE
                LOWER(contract_address) = '0xbc557f677fc5b75d7afdcb7e4f82c1b4843072b1'
                AND stake_stat = '01';
        `;

        const result = await AppDataSource.query(query);
        //console.log('Staking Information:', result);

        // Extract unique user wallet addresses
        const uniqueUserWallets = [...new Set(result.map((item: { user_wallet: string }) => item.user_wallet))];
        console.log('Unique User Wallets:', uniqueUserWallets);

        return uniqueUserWallets;
    } catch (error) {
        console.error('Error fetching staking information:', error);
        throw error;
    }
}

async function initializeGuildSDK() {
    // Initialize Guild SDK
    const guildClient = createGuildClient(process.env.MY_GUILD_PROJECT || '');
    console.log('Guild SDK initialized');
    return guildClient;
}

async function getCurrentAllowlist(guildClient: any, config: any, signerFunction: any) {
    try {
      console.log('🛠️ Current Allowlist Get Started');
      const { guild: { role: { requirement: requirementClient } } } = guildClient;
      
      const requirement = await requirementClient.get(
        config.guildId,
        config.roleId,
        config.allowlistRequirementId,
        signerFunction
      );
      
      return requirement?.data?.addresses || [];
    } catch (error) {
      console.error('Current Allowlist Get Failed:', error);
      return [];
    }
}

/**
 * Guild Allowlist 업데이트
 */
async function updateAllowlist(guildClient: any, config: any, signerFunction: any, addresses: any) {
    try {
      const { guild: { role: { requirement: requirementClient } } } = guildClient;
      
      console.log(`✅ Allowlist 업데이트 중... (${addresses.length}개 주소)`);
      
      const updatedRequirement = await requirementClient.update(
        config.guildId,
        config.roleId,
        config.allowlistRequirementId,
        { 
          data: { 
            addresses: addresses // 소문자로 변환된 주소 리스트
          } 
        },
        signerFunction
      );
      
      console.log('✅ Guild Allowlist Update Success');
      return updatedRequirement;
      
    } catch (error) {
      console.error('❌ Guild Allowlist Update Failed:', error);
      throw error;
    }
}

async function checkGuildInfo(guildClient: any, guildUrlName: string) {
    const { guild: client } = guildClient;
    const { guild: { role: roleClient } } = guildClient;
    const {
        guild: {
          role: { requirement: requirementClient },
        },
      } = guildClient;

    const guild = await client.get(guildUrlName);
    console.log('Guild:', guild);

    if (guild) {
        // Get the members of a guild
        const members = await client.getMembers(
            guild.id,
            //signerFunction // Optional, if a valid signer is provided, the result will contain private data
        );
        console.log('Members:', members);
    }

    if(roleClient) {
        const roles = await roleClient.getAll(guild.id);
        console.log('Roles:', roles);
    }

    if(requirementClient) {
        const requirements = await requirementClient.getAll(
            guild.id,
            GUILD_CONFIG.roleId,
            //signerFunction // Optional, if a valid signer is provided, the result will contain private data
        );
        console.log('Requirements:', requirements);

        if(requirements.length > 0) {
            const requirement = requirements[0];
            console.log('Requirement:', requirement);
        }
    }
    // if(requirementClient) {
    //     const requirement = await requirementClient.get(guild.id, GUILD_CONFIG.roleId, GUILD_CONFIG.allowlistRequirementId, GUILD_CONFIG.creatorAddress);
    //     console.log('Requirement:', requirement);
    // }
}

async function createSignerFunction() {
    // 환경 변수에서 프라이빗 키 가져오기
    const privateKey = process.env.GUILD_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('GUILD_PRIVATE_KEY is not set in environment variables');
    }

    // ethers wallet 생성
    const ethersWallet = new ethers.Wallet(privateKey);
    
    // Guild SDK signer 생성
    return createSigner.fromEthersWallet(ethersWallet);
}

async function main() {
    await initializeDatabase();
    const stakingInfo = await fetchStakingInfo();
    const guildClient = await initializeGuildSDK();
    const signerFunction = await createSignerFunction();

    // 테스트용 allowlist 주소
    const testAddresses = [
        '0x744A73ea6e81D2951d955F6eC0f7dFE51D6c362b',
        '0x09B050C7A002Bdd37D42E85989aDE0CF799959f0',
    ];

    try {
        // 현재 allowlist 조회
        const currentAllowlist = await getCurrentAllowlist(guildClient, GUILD_CONFIG, signerFunction);
        console.log('Current Allowlist:', currentAllowlist);

        // 주소 비교 (대소문자 구분 없이)
        const currentAddresses = new Set(currentAllowlist.map((addr: string) => addr.toLowerCase()));
        const newAddresses = new Set(testAddresses.map((addr: string) => addr.toLowerCase()));
        
        // 변경사항 확인
        const hasChanges = testAddresses.some((addr: string) => !currentAddresses.has(addr.toLowerCase())) ||
                          currentAllowlist.some((addr: string) => !newAddresses.has(addr.toLowerCase()));

        if (hasChanges) {
            console.log('Changes detected in allowlist. Updating...');
            // allowlist 업데이트
            await updateAllowlist(guildClient, GUILD_CONFIG, signerFunction, testAddresses);
            
            // 업데이트 후 allowlist 확인
            const updatedAllowlist = await getCurrentAllowlist(guildClient, GUILD_CONFIG, signerFunction);
            console.log('Updated Allowlist:', updatedAllowlist);
        } else {
            console.log('No changes detected in allowlist. Skipping update.');
        }
    } catch (error) {
        console.error('Allowlist 업데이트 중 오류 발생:', error);
    }
}

main().catch(error => {
    console.error('Error in main process:', error);
});