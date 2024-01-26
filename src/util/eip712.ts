import { ethers } from "ethers";


const v2_signType = {
    approve: [
        { name: "code", type: "uint256" },
        { name: "data", type: "bytes32" },
        { name: "service", type: "address" },
        { name: "gasToken", type: "address" },
        { name: "gasTokenPrice", type: "uint256" },
        { name: "priorityFee", type: "uint256" },
        { name: "gasLimit", type: "uint256" },
        { name: "isGateway", type: "bool" },
    ],
};

interface TransactionParam {
    code: string;
    data: string;
    service: string;
    gasToken: string;
    gasTokenPrice: string;
    priorityFee: string;
    gasLimit: string;
    isGateway: boolean;
}


export function getSignTypeDataParam(
    chainId: number,
    option: TransactionParam & {
        verifyingContract: string;
        version: string;
    },
): [
        ethers.TypedDataDomain,
        {
            approve: ethers.TypedDataField[];
        },
        { code: string; data: string; service: string; gasToken: string; gasTokenPrice: string; priorityFee: string; gasLimit: string; isGateway: boolean },
    ] {
    const { service, code, data, gasToken, gasTokenPrice, priorityFee, gasLimit, isGateway, verifyingContract, version } = option;

    const domain: ethers.TypedDataDomain = {
        name: "VirtualWallet",
        version,
        chainId,
        verifyingContract,
    };
    const keccakData = ethers.keccak256(data);
    const signData = {
        code,
        data: keccakData,
        service,
        gasToken,
        gasTokenPrice,
        priorityFee,
        gasLimit,
        isGateway: Boolean(isGateway),
    };

    return [domain, v2_signType, signData];
}
