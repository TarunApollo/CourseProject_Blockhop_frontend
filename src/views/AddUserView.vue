<template>
    
    <h1>Add New User</h1>
    <div>
      <input type="text" v-model="username" placeholder="User Name" />
      <input type="password" v-model="password" placeholder="Password" />
      <button @click="sendUser">Add User</button>
    </div>
</template>

<script>
import { useUsersStore } from "@/stores/users";
const store = useUsersStore();

export default {
  name: "AddUserView",
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    validate() {
      return (
        this.username &&
        this.password &&
        this.username.length > 4 &&
        this.password.length > 8
      );
    },

    async sendUser() {
      if (!this.validate()) {
        alert("User name or password is not valid");
        return;
      }
      await store.postUser({ name: this.username, password: this.password });
      this.$router.push("/users");
    },
  },
};
</script>
<style scoped></style>
