import * as React from 'react'
import gql from 'graphql-tag'
import { User, useMeQuery } from '../../generated/graphql'
import { accountsGraphQL, accountsPassword } from '../../utils/apollo'

export const GET_USER = gql`
  query Me {
    me {
      _id
      profile {
        firstName
        lastName
      }
      emails {
        address
      }
    }
  }
`

interface UserState {
  user?: User
  loggingIn: boolean
}

interface UserContext {
  userState: UserState
  setUserState: (userState: UserState) => void
  getUser: () => void
  signUp: (args: {
    firstName: string
    lastName: string
    email: string
    password: string
    isLandlord: boolean
  }) => void
  logIn: (username: string, password: string, isLandlord: boolean) => Promise<void>
  logOut: () => void
}

const initialState = { user: undefined, loggingIn: true }

export const UserContext = React.createContext<UserContext>({
  userState: initialState,
  setUserState: () => {},
  getUser: () => {},
  signUp: () => {},
  logIn: () => new Promise(() => {}),
  logOut: () => {},
})

export const UserProvider: React.FunctionComponent<{}> = props => {
  const me = useMeQuery()
  const [userState, setUserState] = React.useState<UserState>(initialState)
  // React.useEffect(() => {
  //   accountsClient.refreshSession()
  // }, [userState.user && userState.user.id])

  const getUser = async () => {
    let user: any = null
    user = await accountsGraphQL.getUser()
    console.log('tokens', user)

    try {
      await me.refetch()
      console.log('MEEEE', me.data)
      user = me && me.data && me.data.me
    } catch (error) {
      console.error('There was an error logging in.', error)
    } finally {
      setUserState({ user: user && { ...user, _id: user.id }, loggingIn: false })
    }
  }

  const logIn = async (email: string, password: string) => {
    await accountsPassword.login({ password, user: { email } })
    await getUser()
  }

  const signUp = async (args: {
    firstName: string
    lastName: string
    email: string
    password: string
    isLandlord: boolean
  }) => {
    const { firstName, lastName, email, password } = args
    await accountsPassword.createUser({
      password,
      email,
      profile: { firstName, lastName },
    })
    await logIn(email, password)
  }

  const logOut = async () => {
    await accountsGraphQL.logout()
    setUserState({ user: undefined, loggingIn: false })
  }

  return (
    <UserContext.Provider
      value={{
        userState,
        setUserState,
        getUser,
        signUp,
        logIn,
        logOut,
      }}
    >
      {props.children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => React.useContext(UserContext)
