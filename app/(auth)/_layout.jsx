import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const Authlayout = () => {

  return (
    <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" />
      <Stack.Screen name="SignUp" />
    </Stack>
    <StatusBar style="dark" />
  </>
)
  
}

export default Authlayout