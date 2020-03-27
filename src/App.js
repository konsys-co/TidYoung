import React, { useState, useEffect } from 'react'
import { Text, View, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'
import { FontAwesome5, Ionicons, AntDesign } from '@expo/vector-icons'

import { NORMAL } from './constants/userStatus'
import QR from './pages/QR'
import Scanner from './pages/Scanner'
import Contacts from './pages/Contacts'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
// TODO: move UpdateStatus file to the outside of QR
import UpdateStatus from './pages/QR/updateStatus'

const BottomTab = createBottomTabNavigator()
const AppStack = createStackNavigator()

const Main = ({ navigation, userData, setLoggedinStatus, setUserData }) => {
  const status = 'NORMAL' // TODO: Fetch from server later.
  return (
    <BottomTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'QR') {
            return <FontAwesome5 name="qrcode" size={size} color={color} />
          }
          if (route.name === 'Scanner') {
            return <Ionicons name="md-qr-scanner" size={size} color={color} />
          }
          if (route.name === 'Contacts') {
            return <AntDesign name="contacts" size={size} color={color} />
          }
          if (route.name === 'Notifications') {
            return <AntDesign name="bells" size={size} color={color} />
          }
          return null
        },
      })}
      tabBarOptions={{
        activeTintColor: NORMAL[status],
        inactiveTintColor: 'gray',
      }}>
      <BottomTab.Screen name="QR">
        {() => (
          <QR
            navigation={navigation}
            userData={userData}
            setLoggedinStatus={setLoggedinStatus}
            setUserData={setUserData}
          />
        )}
      </BottomTab.Screen>
      <BottomTab.Screen name="Scanner">
        {() => <Scanner userData={userData} />}
      </BottomTab.Screen>
      <BottomTab.Screen name="Contacts" component={Contacts} />
      <BottomTab.Screen name="Notifications" component={Notifications} />
    </BottomTab.Navigator>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9ebee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    backgroundColor: 'grey',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    position: 'absolute',
    bottom: 0,
  },
})

export default () => {
  const [isLoggedin, setLoggedinStatus] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [userData, setUserData] = useState(null)
  const [isImageLoading, setImageLoadStatus] = useState(false)

  useEffect(() => {
    if (!isLoggedin) {
      fetchUserData()
        .then(() => setIsFetching(false))
        .catch(e => console.log(e))
    }
  }, [isLoggedin])

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('@FacebookOAuthKey:accessToken')
      if (token) {
        setIsFetching(true)
        // TODO: integrate with /me instead Facebook API
        // eslint-disable-next-line no-undef
        const response = await fetch(
          `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture.height(500)`,
        )
        const data = await response.json()
        if (data.error) {
          Alert.alert(data.error.message)
          return null
        }
        if (data) {
          setUserData(data)
          setLoggedinStatus(true)
        }
      }
    } catch (error) {
      Alert.alert(error.message)
    } finally {
      setIsFetching(false)
    }
    return null
  }

  if (isFetching)
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )

  if (!isLoggedin)
    return (
      <Login
        fetchUserData={fetchUserData}
        setLoggedinStatus={setLoggedinStatus}
        setIsFetching={setIsFetching}
      />
    )

  if (userData)
    return (
      <NavigationContainer>
        <AppStack.Navigator mode="modal">
          <AppStack.Screen name="Main" options={{ headerShown: false }}>
            {({ navigation }) => (
              <Main
                navigation={navigation}
                userData={userData}
                setLoggedinStatus={setLoggedinStatus}
                setUserData={setUserData}
              />
            )}
          </AppStack.Screen>
          <AppStack.Screen name="UpdateStatus" options={{ headerShown: false }}>
            {({ navigation }) => (
              <UpdateStatus
                navigation={navigation}
                userData={userData}
                options={{ transitionSpec: { open: {}, close: {} } }}
              />
            )}
          </AppStack.Screen>
        </AppStack.Navigator>
      </NavigationContainer>
    )

  return (
    <View style={styles.container}>
      <Text>Error</Text>
    </View>
  )
}
