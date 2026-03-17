<template>
    <ul>
        <li v-for="user in users" v-bind:key="user.id">
            {{ user.name }}
        </li>
    </ul>
</template>


<script>
export default {
    name: "UserList",
    props: {    
        users: []
    }
    
}
</script>


<style scoped>
</style>