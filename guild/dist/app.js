"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const ethers_1 = require("ethers");
const sdk_1 = require("@guildxyz/sdk");
// Guild 설정
const GUILD_CONFIG = {
    guildUrlName: 'ttt-0f1e46',
    guildId: 94039,
    roleId: 174650, // TEST Hakuto role
    allowlistRequirementId: 473466, // allowlist requirement ID
    creatorAddress: '0xd916430a0406eb6bd48873c48f06e628d0142aeb'
};
const GUILD_CONFIG2 = {
    guildUrlName: 'hakuto',
    guildId: 93833,
    roleId: 174566, // Hakuto Lab Role
    allowlistRequirementId: 473649, // allowlist requirement ID
    creatorAddress: '0xF0cbB1e8Fb3fb6BB62689A53fD645A8aAE06fdcB'
};
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield database_1.AppDataSource.initialize();
            console.log('[mysql] Database connection initialized successfully');
        }
        catch (error) {
            console.error('[mysql] Error during database initialization:', error);
            throw error;
        }
    });
}
function fetchStakingInfo() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const result = yield database_1.AppDataSource.query(query);
            //console.log('Staking Information:', result);
            // Extract unique user wallet addresses
            const uniqueUserWallets = [...new Set(result.map((item) => item.user_wallet))];
            console.log('Unique User Wallets:', uniqueUserWallets);
            return uniqueUserWallets;
        }
        catch (error) {
            console.error('Error fetching staking information:', error);
            throw error;
        }
    });
}
function initializeGuildSDK(guildUrlName) {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize Guild SDK
        const guildClient = (0, sdk_1.createGuildClient)(guildUrlName);
        console.log('Guild SDK initialized');
        return guildClient;
    });
}
function getCurrentAllowlist(guildClient, config, signerFunction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log('🛠️ Current Allowlist Get Started');
            const { guild: { role: { requirement: requirementClient } } } = guildClient;
            const requirement = yield requirementClient.get(config.guildId, config.roleId, config.allowlistRequirementId, signerFunction);
            return ((_a = requirement === null || requirement === void 0 ? void 0 : requirement.data) === null || _a === void 0 ? void 0 : _a.addresses) || [];
        }
        catch (error) {
            console.error('Current Allowlist Get Failed:', error);
            return [];
        }
    });
}
/**
 * Guild Allowlist 업데이트
 */
function updateAllowlist(guildClient, config, signerFunction, addresses) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { guild: { role: { requirement: requirementClient } } } = guildClient;
            console.log(`✅ Allowlist Update... (${addresses.length} addresses)`);
            const updatedRequirement = yield requirementClient.update(config.guildId, config.roleId, config.allowlistRequirementId, {
                data: {
                    addresses: addresses // 소문자로 변환된 주소 리스트
                }
            }, signerFunction);
            console.log('✅ Guild Allowlist Update Success');
            return updatedRequirement;
        }
        catch (error) {
            console.error('❌ Guild Allowlist Update Failed:', error);
            throw error;
        }
    });
}
function checkGuildInfo(guildUrlName) {
    return __awaiter(this, void 0, void 0, function* () {
        const guildClient = (0, sdk_1.createGuildClient)('hakuto');
        const { guild: client } = guildClient;
        const { guild: { role: roleClient } } = guildClient;
        const { guild: { role: { requirement: requirementClient }, }, } = guildClient;
        const guild = yield client.get(guildUrlName);
        console.log('guildUrlName:', guildUrlName);
        console.log('Guild ID:', guild.id);
        console.log('Guild URL Name:', guildUrlName);
        if (guild) {
            // Get the members of a guild
            const members = yield client.getMembers(guild.id);
            console.log('Members:', members);
        }
        let roles = [];
        if (roleClient) {
            roles = yield roleClient.getAll(guild.id);
            console.log('Roles:', roles);
        }
        if (requirementClient) {
            for (const role of roles) {
                const requirements = yield requirementClient.getAll(guild.id, role.id);
                console.log('Requirements:', requirements);
                if (requirements.length > 0) {
                    const requirement = requirements[0];
                    console.log('Requirement:', requirement);
                }
            }
        }
        // if(requirementClient) {
        //     const requirement = await requirementClient.get(guild.id, GUILD_CONFIG.roleId, GUILD_CONFIG.allowlistRequirementId, GUILD_CONFIG.creatorAddress);
        //     console.log('Requirement:', requirement);
        // }
    });
}
function createSignerFunction() {
    return __awaiter(this, void 0, void 0, function* () {
        // 환경 변수에서 프라이빗 키 가져오기
        const privateKey = process.env.GUILD_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('GUILD_PRIVATE_KEY is not set in environment variables');
        }
        // ethers wallet 생성
        const ethersWallet = new ethers_1.ethers.Wallet(privateKey);
        // Guild SDK signer 생성
        return sdk_1.createSigner.fromEthersWallet(ethersWallet);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield initializeDatabase();
            const stakingInfo = yield fetchStakingInfo();
            const guildClient = yield initializeGuildSDK(GUILD_CONFIG2.guildUrlName);
            const signerFunction = yield createSignerFunction();
            // console.log('Try to check Guild Info...');
            // await checkGuildInfo(GUILD_CONFIG2.guildUrlName);
            // return;
            console.log('Try to update Allowlist with Staking Info...');
            try {
                // 현재 allowlist 조회
                const currentAllowlist = yield getCurrentAllowlist(guildClient, GUILD_CONFIG2, signerFunction);
                console.log('Current Allowlist:', currentAllowlist);
                // 주소 비교 (대소문자 구분 없이)
                const currentAddresses = new Set(currentAllowlist.map((addr) => addr.toLowerCase()));
                const newAddresses = new Set(stakingInfo.map((addr) => addr.toLowerCase()));
                // 합집합 생성: 기존 allowlist + 새로운 데이터베이스 주소들
                const combinedAddresses = new Set([...currentAddresses, ...newAddresses]);
                const finalAddressList = Array.from(combinedAddresses);
                console.log(`📊 Address Summary:`);
                console.log(`   - Current allowlist: ${currentAllowlist.length} addresses`);
                console.log(`   - New staking addresses: ${stakingInfo.length} addresses`);
                console.log(`   - Combined total: ${finalAddressList.length} addresses`);
                // 변경사항 확인 (합집합과 현재 allowlist 비교)
                const hasChanges = finalAddressList.length !== currentAllowlist.length ||
                    finalAddressList.some((addr) => !currentAddresses.has(addr.toLowerCase()));
                if (hasChanges) {
                    console.log('🔄 Changes detected in allowlist. Updating...');
                    // 합집합으로 allowlist 업데이트
                    yield updateAllowlist(guildClient, GUILD_CONFIG2, signerFunction, finalAddressList);
                    // 업데이트 후 allowlist 확인
                    const updatedAllowlist = yield getCurrentAllowlist(guildClient, GUILD_CONFIG2, signerFunction);
                    console.log('✅ Updated Allowlist:', updatedAllowlist);
                }
                else {
                    console.log('✅ No changes detected in allowlist. Skipping update.');
                }
            }
            catch (error) {
                console.error('❌ Allowlist update error:', error);
            }
        }
        finally {
            // 데이터베이스 연결 종료
            if (database_1.AppDataSource.isInitialized) {
                yield database_1.AppDataSource.destroy();
                console.log('[mysql] Database connection closed');
            }
            console.log('🏁 Process completed successfully');
            process.exit(0);
        }
    });
}
function testing(guildClient, config, signerFunction, addresses) {
    return __awaiter(this, void 0, void 0, function* () {
        // 테스트용 allowlist 주소
        const testAddresses = [
            '0x744A73ea6e81D2951d955F6eC0f7dFE51D6c362b',
            '0x09B050C7A002Bdd37D42E85989aDE0CF799959f0',
        ];
        try {
            // 현재 allowlist 조회
            const currentAllowlist = yield getCurrentAllowlist(guildClient, GUILD_CONFIG, signerFunction);
            console.log('Current Allowlist:', currentAllowlist);
            // 주소 비교 (대소문자 구분 없이)
            const currentAddresses = new Set(currentAllowlist.map((addr) => addr.toLowerCase()));
            const newAddresses = new Set(testAddresses.map((addr) => addr.toLowerCase()));
            // 합집합 생성: 기존 allowlist + 새로운 테스트 주소들
            const combinedAddresses = new Set([...currentAddresses, ...newAddresses]);
            const finalAddressList = Array.from(combinedAddresses);
            console.log(`📊 Test Address Summary:`);
            console.log(`   - Current allowlist: ${currentAllowlist.length} addresses`);
            console.log(`   - New test addresses: ${testAddresses.length} addresses`);
            console.log(`   - Combined total: ${finalAddressList.length} addresses`);
            // 변경사항 확인 (합집합과 현재 allowlist 비교)
            const hasChanges = finalAddressList.length !== currentAllowlist.length ||
                finalAddressList.some((addr) => !currentAddresses.has(addr.toLowerCase()));
            if (hasChanges) {
                console.log('🔄 Changes detected in allowlist. Updating...');
                // 합집합으로 allowlist 업데이트
                yield updateAllowlist(guildClient, GUILD_CONFIG, signerFunction, finalAddressList);
                // 업데이트 후 allowlist 확인
                const updatedAllowlist = yield getCurrentAllowlist(guildClient, GUILD_CONFIG, signerFunction);
                console.log('✅ Updated Allowlist:', updatedAllowlist);
            }
            else {
                console.log('✅ No changes detected in allowlist. Skipping update.');
            }
        }
        catch (error) {
            console.error('❌ Allowlist update error:', error);
        }
    });
}
main().catch(error => {
    console.error('Error in main process:', error);
});
