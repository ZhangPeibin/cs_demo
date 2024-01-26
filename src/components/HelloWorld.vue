<script setup>

import { onMounted } from 'vue';
import { initGoogleSDK } from '../util/utils'


defineProps({
  msg: {
    type: String,
    required: true
  }
})


function initGoogle() {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: '138718834585-m7dkpqq88p7slpk7qe18oua92092chf1.apps.googleusercontent.com',
      ux_mode: 'popup',
      // 登录成功后的回调
      callback: googleLoginCallback
    })
    
    window.google.accounts.id.renderButton(
      this.$refs.signInButton,
      {
        prompt_parent_id: 'google-signin-button',
        theme: 'outline',
        logo_alignment: 'center',
        width: '400'
      }
    )
  }
}
// 初始化按钮


function googleLoginCallback(res) {
  console.log(res.credential)
  // 调用api进行登录...
}

onMounted(() => {
  initGoogleSDK(() => {
    initGoogle();
  });
});

</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>
      You’ve successfully created a project with
      <a href="https://vitejs.dev/" target="_blank" rel="noopener">Vite</a> +
      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>.
    </h3>

    <div id="g_id_signIn" ref="signInButton"></div>

  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {

  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
