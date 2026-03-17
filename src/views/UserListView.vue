<template>
    <div>
        <h1>
            Welcome to the User List
        </h1>
        <UserList :users="users" />

    </div>
</template>

<script>
import UserList from '@/components/UserList.vue'
import { useUsersStore } from "@/stores/users";

const store = useUsersStore();

export default {
    name: "UserListView",
    components: {
        UserList
    },
    data() {
        return {
            users: [],
        }
    },
    async mounted() {
        await store.fetchUsers()
        this.users = store.users
    }
}

</script>

<style scoped>

</style>