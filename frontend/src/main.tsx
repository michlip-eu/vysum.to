import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App, Cart, Login, Logout, Navbar, Products, Register } from './newApp'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { StoreProvider } from 'easy-peasy'
import { store } from './store'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AdminOverlay, AdminMainPage, AdminProducts, AdminProductAdd, AdminProductEdit, AdminUsers, AdminContact } from './admin'
import './index.css'


const routes = createBrowserRouter([
  {
    path: "/admin",
    element: <AdminOverlay />,
    children: [
      {
        index: true,
        Component: AdminMainPage
      },
      {
        path: "users",
        Component: AdminUsers
      },
      {
        path: "products",
        Component: AdminProducts
      },
      {
        path: "product-add",
        Component: AdminProductAdd
      },
      {
        path: "product/*",
        Component: AdminProductEdit
      },
      {
        path: "messages",
        Component: AdminContact
      }
    ]
  },


  {
    path: "/login",
    element: <><Navbar /><Login /></>
  },
  {
    path: "/register",
    element: <><Navbar /><Register /></>
  },
  {
    path: "/logout",
    element: <><Navbar /><Logout /></>
  },

  {
    path: "/products",
    element: <><Navbar /><Products /></>
  },
  {
    path: "/cart",
    element: <><Navbar /><Cart /></>
  },

  {
    path: "*",
    element: <><Navbar /><App /></>
  },
])


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider store={store}>
      <ToastContainer theme='dark' />
      <RouterProvider router={routes} />
    </StoreProvider>
  </StrictMode>,
)
