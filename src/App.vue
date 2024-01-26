<script setup>
import { Signer as CsEthersSigner } from "@cubist-labs/cubesigner-sdk-ethers-v6";

import { onMounted } from 'vue';
import { initGoogleSDK } from './util/utils';
import * as cs from "@cubist-labs/cubesigner-sdk";
import { ethers } from "ethers";
import {getSignTypeDataParam} from "@/util/eip712"

import json from "/Users/wiki/Library/Application Support/cubesigner/management-session.json"

const orgId = "Org#1ad02570-f967-47bd-9a53-f8a92f249930"
const env = { "SignerApiRoot": "https://gamma.signer.cubist.dev" }
let localOidcToken = ""
const AMOUNT = ethers.parseEther("0.0000001")
const TO_ADDRESS = "0xa5B1f001406B103B9809a2Ae1ae8348D008E93D6"
/**
 * 加载google的插件
 */
onMounted(() => {
  initGoogleSDK(() => {
    initGoogle();
  });
});

/**
 * 1.导入google组件
 * 2.初始化google sigin 按钮
 */
function initGoogle() {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: '138718834585-m7dkpqq88p7slpk7qe18oua92092chf1.apps.googleusercontent.com',
      ux_mode: 'popup',
      // 登录成功后的回调
      callback: googleLoginCallback
    })

    window.google.accounts.id.renderButton(
      document.getElementById("g_id_signIn"),
      {
        prompt_parent_id: 'google-signin-button',
        theme: 'outline',
        logo_alignment: 'center',
        width: '400'
      }
    )
  }
}

/**
 * 
 * @param {google授权成功的token} res 
 */
function googleLoginCallback(res) {
  console.log(res.credential)
  // 调用api进行登录...
  handleOidcToken(res.credential)
}

/**
 * 统一处理oidc的token
 * google. facebook ... 
 * 1: 获取cs的identity
 * 2: 如果cs没有user_info,则需要创建 user_info
 */
async function handleOidcToken(oidcToken) {
  localOidcToken = oidcToken
  // get oidc proof 
  const identityProve = await newOidcClient(oidcToken).identityProve()
  console.log(identityProve)
  if (!identityProve.user_info) {
    //如果该oidcToken没有想关联的user_info,则需要为该oidcToken创建相应的user_info
    console.log('Starting creating user ...')
    //获取管理会话session
    const sessionStore = new cs.MemorySessionStorage(json)
    const cubesigner = await cs.CubeSignerClient.loadManagementSession(sessionStore)

    const org = new cs.Org(cubesigner);
    //验证找个oidc的 identity是否合法
    try {
      await org.verifyIdentity(identityProve)
    } catch (error) {
      console.log('Not verified')
    }

    console.log("verify identity success")

    const iss = identityProve.identity.iss;
    const sub = identityProve.identity.sub;
    const email = identityProve.email;

    localIss = iss;
    localSub = sub;

    //createOidcUser的时候不加 mfa policy
    const userId = await org.createOidcUser({ iss, sub }, email)

    console.log('Create  user' + userId)

    // org为找个 user 创建对应的key 
    const key = await org.createKey(cs.Secp256k1.Evm, userId)

    console.log('Create key for user' + userId)
    console.log('key ' + key)
  }
}

async function deleteUser() {
  console.log(localOidcToken)
  console.log(json)
  const identityProve = await newOidcClient(localOidcToken).identityProve()
  // const a = await newOidcClient(localOidcToken);
  // a.sessionCreate();

  // a.sessionCreate();
  const sessionStore = new cs.MemorySessionStorage(json)
  const cubesigner = await cs.CubeSignerClient.loadManagementSession(sessionStore)
  const org = new cs.Org(cubesigner);
  console.log(identityProve)
  // const result = await org.orgUserDeleteOidc(identityProve.identity)
  // console.log(result)
  const aboutme = await cubesigner.aboutMe();
  console.log(aboutme)

}

/**
 * 签署交易
 */
async function sign() {
  const signReq = {
    chain_id: 56,
    tx: {
      type: "0x00",
      gas: "0x61a80",
      gasPrice: "0x77359400",
      nonce: "0",
      to: "0x66e2b61f60c1c473ee2bcf850185648ac3762410",
      value: "0x001"
    },
  };

  const sessionMgr = await oidcLogin(localOidcToken, ["sign:*"]);
  const oidcSession = new cs.SignerSession(sessionMgr);
  // Just grab the first key for the user
  const key = (await oidcSession.keys())[0];
  // Sign the transaction
  console.log("Signing tx", key.material_id, signReq);
  const sig = (await oidcSession.signEvm(key.material_id, signReq)).data();
  alert(`Signed transaction: ${sig.rlp_signed_tx}`);
  console.log(`Signed transaction: ${sig.rlp_signed_tx}`);
}


async function sendTx() {
  const signReq = {
    chain_id: 56,
    tx: {
      type: "0x00",
      gas: "0x61a80",
      gasPrice: "0x77359400",
      nonce: "0",
      to: "0x66e2b61f60c1c473ee2bcf850185648ac3762410",
      value: "0x001"
    },
  };

  const sessionMgr = await oidcLogin(localOidcToken, ["sign:*"]);
  const oidcSession = new cs.SignerSession(sessionMgr);
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
  const signer = new CsEthersSigner("0x1572bE19BD7CDDE8E1414853a979C733130d569E", oidcSession, { provider });

  // get balance
  const addr = await signer.getAddress();
  console.log(`${addr} has ${await provider.getBalance(addr)} gwei`);

  console.log(`Transferring ${AMOUNT} wei from ${addr} to ${TO_ADDRESS}...`);

  const tx = {
    to: TO_ADDRESS,
    value: AMOUNT,
  };

  const response = await signer.sendTransaction(tx);
  await response.wait();

  // get new balance
  console.log(`${addr} has ${await provider.getBalance(addr)} gwei`);
}


async function signMessage() {

  const sessionMgr = await oidcLogin(localOidcToken, ["sign:*","manage:*"]);
  const oidcSession = new cs.SignerSession(sessionMgr);
  const keyinfo = (await oidcSession.keys())[0];
  console.log(keyinfo)
  // const key = await oidcSession.getKey(keyinfo.id)
  // console.log(key)
  // await key.appendPolicy(["AllowRawBlobSigning"])
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
  const signer = new CsEthersSigner(keyinfo.materialId, oidcSession, { provider });
  
  const verifyingContract = ethers.ZeroAddress;
  const version = "2";
  const chainId = 1

  const transactionParam = {
    code: "1",
    data: "0x",
    service: ethers.ZeroAddress,
    gasToken: ethers.ZeroAddress,
    gasTokenPrice: "0",
    priorityFee: "0",
    gasLimit: "0",
    isGateway: false,
  };

  const [domain, v2_signType, signData] = getSignTypeDataParam(chainId, { ...transactionParam, verifyingContract, version });
  const signature = await signer.signTypedData(domain,v2_signType,signData);
  console.log(signature)
  const verifyOwner = ethers.verifyTypedData(domain, v2_signType, signData, signature);
  console.log(verifyOwner)
}






async function oidcLogin(oidcToken, scopes) {
  console.log("Logging in with OIDC")
  let resp = await newOidcClient(oidcToken).sessionCreate(scopes);
  console.log(resp);
  if (resp.requiresMfa()) {
    const mfaSession = resp.mfaSessionInfo();
    const mfaSessionMgr = await cs.SignerSessionManager.createFromSessionInfo(env, orgId, mfaSession);
    const signerSession = new cs.SignerSession(mfaSessionMgr);
    const mfaId = resp.mfaId();
    const challenge = await signerSession.fidoApproveStart(mfaId);
    console.log("MFA FIDO challenge", challenge);

    // === only needed when testing locally ===
    delete challenge.options.rpId;
    // ====================================-===

    // prompt the user to tap their FIDO and send the answer back to CubeSigner
    const mfaInfo = await challenge.createCredentialAndAnswer();

    // print out the current status of the MFA request and assert that it has been approved
    console.log("MFA info", mfaInfo);
    if (!mfaInfo.receipt) {
      throw new Error("MFA not approved yet");
    }

    // proceed with the MFA approval
    resp = await resp.signWithMfaApproval({
      mfaId,
      mfaOrgId: orgId,
      mfaConf: mfaInfo.receipt.confirmation
    });
  }
  if (resp.requiresMfa()) {
    throw new Error("MFA should not be required after approval");
  }
  const sessionInfo = resp.data();
  return await cs.SignerSessionManager.createFromSessionInfo(env, orgId, sessionInfo);
}

/**
 * 创建oidc的Client
 * @param {*} oidcToken oidcToken str
 */
function newOidcClient(oidcToken) {
  return new cs.OidcClient(env, orgId, oidcToken);
}


</script>

<template>
  <header>
    <div class="wrapper">
      <div id="g_id_signIn" ref="signInButton"></div>

      <button @click="deleteUser"> 退出 </button>
      <button @click="sign"> sign </button>
      <button @click="sendTx"> sendtx </button>
      <button @click="signMessage"> signMessage </button>

    </div>
  </header>

  <!-- <RouterView /> -->
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
