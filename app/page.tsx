"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  ShoppingCart,
  BarChart3,
  Settings,
  X,
  Edit,
  LogOut,
  Users,
  Eye,
  EyeOff,
  Loader2,
  Bell,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase, type User, type ShoppingItem, type CustomCategory, type ProductHistory } from "@/lib/supabase"
import { DatabaseSetup } from "@/components/database-setup"

const categories = [
  "Fruits & Légumes",
  "Viandes & Poissons",
  "Produits Laitiers",
  "Épicerie",
  "Surgelés",
  "Hygiène & Beauté",
  "Entretien",
  "Autres",
]

const categoryColors = {
  "Fruits & Légumes": "bg-green-100 text-green-800",
  "Viandes & Poissons": "bg-red-100 text-red-800",
  "Produits Laitiers": "bg-blue-100 text-blue-800",
  Épicerie: "bg-yellow-100 text-yellow-800",
  Surgelés: "bg-cyan-100 text-cyan-800",
  "Hygiène & Beauté": "bg-pink-100 text-pink-800",
  Entretien: "bg-purple-100 text-purple-800",
  Autres: "bg-gray-100 text-gray-800",
}

interface Notification {
  id: string
  message: string
  timestamp: Date
  type: "add" | "edit" | "delete" | "toggle"
  itemName: string
  modifiedBy: string
}

export default function ShoppingListApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [items, setItems] = useState<ShoppingItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newItemName, setNewItemName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [groupByCategory, setGroupByCategory] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewingUserId, setViewingUserId] = useState<string>("")
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false)
  const [resetPasswordForm, setResetPasswordForm] = useState({ userId: "", newPassword: "" })

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)

  // Système de notifications
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Système de suggestions de produits
  const [productHistory, setProductHistory] = useState<ProductHistory[]>([])
  const [productSuggestions, setProductSuggestions] = useState<ProductHistory[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<ProductHistory | null>(null)

  const allCategories = [...categories, ...customCategories.map((c) => c.name), "Créer une nouvelle catégorie..."]

  // Chargement initial des données
  useEffect(() => {
    const initializeApp = async () => {
      await loadInitialData()
    }
    initializeApp()
  }, [])

  // Chargement des données utilisateur quand l'utilisateur change
  useEffect(() => {
    if (currentUser) {
      loadUserData()
      loadProductHistory()
      if (!viewingUserId) {
        setViewingUserId(currentUser.id)
      }
    }
  }, [currentUser])

  // Recherche de suggestions quand on tape dans le champ nom
  useEffect(() => {
    if (newItemName.length >= 2 && productHistory.length > 0) {
      const suggestions = productHistory
        .filter((product) => product.name.toLowerCase().includes(newItemName.toLowerCase()))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 5)

      setProductSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } else {
      setShowSuggestions(false)
      setProductSuggestions([])
    }
  }, [newItemName, productHistory])

  const loadInitialData = async () => {
    try {
      // Vérifier d'abord si les tables existent
      const { data: testData, error: testError } = await supabase.from("users").select("id").limit(1)

      if (testError) {
        if (testError.code === "42P01") {
          // Tables n'existent pas
          console.log("Tables non trouvées, utilisation des données par défaut")
          setTablesExist(false)
          setUsers([
            { id: "lulu", username: "Lulu", password: "Misty123", is_admin: false },
            { id: "lolo", username: "Lolo", password: "Misty123", is_admin: false },
            { id: "admin", username: "Admin", password: "Misty123", is_admin: true },
          ])
          return
        }
        throw testError
      }

      // Si on arrive ici, les tables existent
      setTablesExist(true)

      // Charger les utilisateurs
      const { data: usersData, error: usersError } = await supabase.from("users").select("*").order("username")

      if (usersError) throw usersError
      setUsers(usersData || [])

      // Charger les catégories personnalisées
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("custom_categories")
        .select("*")
        .order("name")

      if (categoriesError) throw categoriesError
      setCustomCategories(categoriesData || [])
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      // En cas d'erreur, utiliser les données par défaut et marquer les tables comme inexistantes
      setTablesExist(false)
      setUsers([
        { id: "lulu", username: "Lulu", password: "Misty123", is_admin: false },
        { id: "lolo", username: "Lolo", password: "Misty123", is_admin: false },
        { id: "admin", username: "Admin", password: "Misty123", is_admin: true },
      ])
    }
  }

  const loadUserData = async () => {
    if (!currentUser) return

    try {
      // Si les tables n'existent pas, utiliser des données vides
      if (tablesExist === false) {
        setItems([])
        setGroupByCategory(false)
        return
      }

      // Charger les articles de l'utilisateur
      const { data: itemsData, error: itemsError } = await supabase
        .from("shopping_items")
        .select("*")
        .order("created_at", { ascending: false })

      if (itemsError && itemsError.code !== "42P01") {
        throw itemsError
      }

      setItems(itemsData || [])

      // Charger les paramètres utilisateur
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", currentUser.id)
        .single()

      if (settingsError && settingsError.code !== "PGRST116" && settingsError.code !== "42P01") {
        throw settingsError
      }

      if (settingsData) {
        setGroupByCategory(settingsData.group_by_category)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error)
      // En cas d'erreur, utiliser les valeurs par défaut
      setItems([])
      setGroupByCategory(false)
    }
  }

  const loadProductHistory = async () => {
    if (!currentUser || tablesExist === false) {
      setProductHistory([])
      return
    }

    try {
      const { data: historyData, error: historyError } = await supabase
        .from("product_history")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("usage_count", { ascending: false })
        .order("last_used", { ascending: false })

      if (historyError && historyError.code !== "42P01") {
        throw historyError
      }

      setProductHistory(historyData || [])
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique des produits:", error)
      setProductHistory([])
    }
  }

  const saveToProductHistory = async (item: Partial<ShoppingItem>) => {
    if (!currentUser || tablesExist === false) return

    try {
      // Vérifier si le produit existe déjà dans l'historique
      const { data: existingProduct, error: searchError } = await supabase
        .from("product_history")
        .select("*")
        .eq("name", item.name)
        .eq("user_id", currentUser.id)
        .eq("category", item.category)
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      if (existingProduct) {
        // Mettre à jour le produit existant
        const { error: updateError } = await supabase
          .from("product_history")
          .update({
            usage_count: existingProduct.usage_count + 1,
            last_used: new Date().toISOString(),
            description: item.description || existingProduct.description,
            price: item.price || existingProduct.price,
            weight: item.weight || existingProduct.weight,
            store: item.store || existingProduct.store,
            remarks: item.remarks || existingProduct.remarks,
          })
          .eq("id", existingProduct.id)

        if (updateError) throw updateError
      } else {
        // Créer un nouveau produit dans l'historique
        const { error: insertError } = await supabase.from("product_history").insert([
          {
            name: item.name!,
            category: item.category!,
            description: item.description,
            price: item.price,
            weight: item.weight,
            store: item.store,
            remarks: item.remarks,
            user_id: currentUser.id,
            usage_count: 1,
            last_used: new Date().toISOString(),
          },
        ])

        if (insertError) throw insertError
      }

      // Recharger l'historique
      await loadProductHistory()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde dans l'historique:", error)
    }
  }

  const selectSuggestion = (suggestion: ProductHistory) => {
    setSelectedSuggestion(suggestion)
    setNewItemName(suggestion.name)
    setSelectedCategory(suggestion.category)
    setShowSuggestions(false)
  }

  const addNotification = (type: Notification["type"], itemName: string, modifiedBy: string) => {
    // Ne pas ajouter de notification si c'est l'utilisateur actuel qui fait la modification
    if (modifiedBy === currentUser?.id) return

    // Ne pas ajouter de notification si on regarde sa propre liste
    if (viewingUserId === currentUser?.id) return

    const messages = {
      add: `${users.find((u) => u.id === modifiedBy)?.username} a ajouté "${itemName}"`,
      edit: `${users.find((u) => u.id === modifiedBy)?.username} a modifié "${itemName}"`,
      delete: `${users.find((u) => u.id === modifiedBy)?.username} a supprimé "${itemName}"`,
      toggle: `${users.find((u) => u.id === modifiedBy)?.username} a coché/décoché "${itemName}"`,
    }

    const notification: Notification = {
      id: Date.now().toString(),
      message: messages[type],
      timestamp: new Date(),
      type,
      itemName,
      modifiedBy,
    }

    setNotifications((prev) => [notification, ...prev.slice(0, 9)]) // Garder seulement les 10 dernières
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const login = async () => {
    setLoading(true)
    setLoginError("")

    try {
      // Si les tables n'existent pas, utiliser l'authentification locale
      if (tablesExist === false) {
        const user = users.find(
          (u) => u.username.toLowerCase() === loginForm.username.toLowerCase() && u.password === loginForm.password,
        )
        if (user) {
          setCurrentUser(user)
          setLoginForm({ username: "", password: "" })
        } else {
          setLoginError("Nom d'utilisateur ou mot de passe incorrect")
        }
        return
      }

      // Sinon, utiliser Supabase
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", loginForm.username)
        .eq("password", loginForm.password)
        .single()

      if (error || !userData) {
        setLoginError("Nom d'utilisateur ou mot de passe incorrect")
        return
      }

      setCurrentUser(userData)
      setLoginForm({ username: "", password: "" })
    } catch (error) {
      console.error("Erreur de connexion:", error)
      setLoginError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setViewingUserId("")
    setItems([])
    setNotifications([])
    setProductHistory([])
    setLoginForm({ username: "", password: "" })
  }

  const resetPassword = async () => {
    if (!resetPasswordForm.userId || !resetPasswordForm.newPassword) return

    try {
      if (tablesExist === false) {
        // Mode local - mettre à jour en mémoire
        setUsers(
          users.map((user) =>
            user.id === resetPasswordForm.userId ? { ...user, password: resetPasswordForm.newPassword } : user,
          ),
        )
        setResetPasswordForm({ userId: "", newPassword: "" })
        alert("Mot de passe réinitialisé avec succès !")
        return
      }

      const { error } = await supabase
        .from("users")
        .update({ password: resetPasswordForm.newPassword })
        .eq("id", resetPasswordForm.userId)

      if (error) throw error

      setResetPasswordForm({ userId: "", newPassword: "" })
      alert("Mot de passe réinitialisé avec succès !")

      // Recharger les utilisateurs
      loadInitialData()
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error)
      alert("Erreur lors de la réinitialisation du mot de passe")
    }
  }

  const changePassword = async () => {
    if (!currentUser) return

    if (changePasswordForm.currentPassword !== currentUser.password) {
      setPasswordError("Mot de passe actuel incorrect")
      return
    }

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas")
      return
    }

    if (changePasswordForm.newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    try {
      if (tablesExist === false) {
        // Mode local - mettre à jour en mémoire
        const updatedUser = { ...currentUser, password: changePasswordForm.newPassword }
        setCurrentUser(updatedUser)
        setUsers(users.map((user) => (user.id === currentUser.id ? updatedUser : user)))
        setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setPasswordError("")
        setIsChangePasswordOpen(false)
        alert("Mot de passe modifié avec succès !")
        return
      }

      const { error } = await supabase
        .from("users")
        .update({ password: changePasswordForm.newPassword })
        .eq("id", currentUser.id)

      if (error) throw error

      setCurrentUser({ ...currentUser, password: changePasswordForm.newPassword })
      setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setPasswordError("")
      setIsChangePasswordOpen(false)
      alert("Mot de passe modifié avec succès !")
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error)
      setPasswordError("Erreur lors du changement de mot de passe")
    }
  }

  const addCustomCategory = async () => {
    if (!newCategoryName.trim()) return

    const categoryName = newCategoryName.trim()

    // Vérifier si la catégorie existe déjà
    if (categories.includes(categoryName) || customCategories.some((c) => c.name === categoryName)) {
      alert("Cette catégorie existe déjà")
      return
    }

    try {
      if (tablesExist === false) {
        // Mode local - ajouter en mémoire
        const newCategory = { id: Date.now().toString(), name: categoryName }
        setCustomCategories([...customCategories, newCategory])
        setSelectedCategory(categoryName)
        setNewCategoryName("")
        setIsAddCategoryOpen(false)
        return
      }

      const { data, error } = await supabase
        .from("custom_categories")
        .insert([{ name: categoryName }])
        .select()
        .single()

      if (error) throw error

      setCustomCategories([...customCategories, data])
      setSelectedCategory(categoryName)
      setNewCategoryName("")
      setIsAddCategoryOpen(false)
    } catch (error) {
      console.error("Erreur lors de la création de la catégorie:", error)
      alert("Erreur lors de la création de la catégorie")
    }
  }

  const handleCategoryChange = (value: string) => {
    if (value === "Créer une nouvelle catégorie...") {
      setIsAddCategoryOpen(true)
    } else {
      setSelectedCategory(value)
    }
  }

  const addItem = async () => {
    if (!newItemName.trim() || !selectedCategory || !currentUser) return

    const newItemData = {
      name: newItemName.trim(),
      category: selectedCategory,
      description: selectedSuggestion?.description,
      price: selectedSuggestion?.price,
      weight: selectedSuggestion?.weight,
      store: selectedSuggestion?.store,
      remarks: selectedSuggestion?.remarks,
    }

    try {
      if (tablesExist === false) {
        // Mode local - ajouter en mémoire
        const newItem: ShoppingItem = {
          id: Date.now().toString(),
          ...newItemData,
          completed: false,
          user_id: viewingUserId, // Utiliser viewingUserId au lieu de currentUser.id
        }
        setItems([newItem, ...items])

        // Ajouter notification si on modifie la liste d'un autre utilisateur
        if (viewingUserId !== currentUser.id) {
          addNotification("add", newItemName.trim(), currentUser.id)
        }

        setNewItemName("")
        setSelectedCategory("")
        setSelectedSuggestion(null)
        setIsAddDialogOpen(false)
        return
      }

      const { data, error } = await supabase
        .from("shopping_items")
        .insert([
          {
            ...newItemData,
            user_id: viewingUserId, // Utiliser viewingUserId au lieu de currentUser.id
          },
        ])
        .select()
        .single()

      if (error) throw error

      setItems([data, ...items])

      // Sauvegarder dans l'historique des produits
      await saveToProductHistory(newItemData)

      // Ajouter notification si on modifie la liste d'un autre utilisateur
      if (viewingUserId !== currentUser.id) {
        addNotification("add", newItemName.trim(), currentUser.id)
      }

      setNewItemName("")
      setSelectedCategory("")
      setSelectedSuggestion(null)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'article:", error)
      alert("Erreur lors de l'ajout de l'article")
    }
  }

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    try {
      if (tablesExist === false) {
        // Mode local - mettre à jour en mémoire
        setItems(items.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)))

        // Ajouter notification si on modifie la liste d'un autre utilisateur
        if (item.user_id !== currentUser?.id) {
          addNotification("toggle", item.name, currentUser?.id || "")
        }

        return
      }

      const { error } = await supabase.from("shopping_items").update({ completed: !item.completed }).eq("id", id)

      if (error) throw error

      setItems(items.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)))

      // Ajouter notification si on modifie la liste d'un autre utilisateur
      if (item.user_id !== currentUser?.id) {
        addNotification("toggle", item.name, currentUser?.id || "")
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      alert("Erreur lors de la mise à jour de l'article")
    }
  }

  const deleteItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    try {
      if (tablesExist === false) {
        // Mode local - supprimer de la mémoire
        setItems(items.filter((i) => i.id !== id))

        // Ajouter notification si on modifie la liste d'un autre utilisateur
        if (item.user_id !== currentUser?.id) {
          addNotification("delete", item.name, currentUser?.id || "")
        }

        return
      }

      const { error } = await supabase.from("shopping_items").delete().eq("id", id)

      if (error) throw error

      setItems(items.filter((i) => i.id !== id))

      // Ajouter notification si on modifie la liste d'un autre utilisateur
      if (item.user_id !== currentUser?.id) {
        addNotification("delete", item.name, currentUser?.id || "")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      alert("Erreur lors de la suppression de l'article")
    }
  }

  const updateItem = async (updatedItem: ShoppingItem) => {
    try {
      if (tablesExist === false) {
        // Mode local - mettre à jour en mémoire
        setItems(items.map((i) => (i.id === updatedItem.id ? updatedItem : i)))

        // Ajouter notification si on modifie la liste d'un autre utilisateur
        if (updatedItem.user_id !== currentUser?.id) {
          addNotification("edit", updatedItem.name, currentUser?.id || "")
        }

        setEditingItem(null)
        setIsEditDialogOpen(false)
        return
      }

      const { error } = await supabase
        .from("shopping_items")
        .update({
          name: updatedItem.name,
          category: updatedItem.category,
          description: updatedItem.description,
          price: updatedItem.price,
          weight: updatedItem.weight,
          store: updatedItem.store,
          remarks: updatedItem.remarks,
        })
        .eq("id", updatedItem.id)

      if (error) throw error

      setItems(items.map((i) => (i.id === updatedItem.id ? updatedItem : i)))

      // Sauvegarder dans l'historique des produits
      await saveToProductHistory(updatedItem)

      // Ajouter notification si on modifie la liste d'un autre utilisateur
      if (updatedItem.user_id !== currentUser?.id) {
        addNotification("edit", updatedItem.name, currentUser?.id || "")
      }

      setEditingItem(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      alert("Erreur lors de la mise à jour de l'article")
    }
  }

  const openEditDialog = (item: ShoppingItem) => {
    setEditingItem({ ...item })
    setIsEditDialogOpen(true)
  }

  const updateUserSettings = async (newGroupByCategory: boolean) => {
    if (!currentUser) return

    try {
      if (tablesExist === false) {
        // Mode local - mettre à jour en mémoire
        setGroupByCategory(newGroupByCategory)
        return
      }

      const { error } = await supabase.from("user_settings").upsert({
        user_id: currentUser.id,
        group_by_category: newGroupByCategory,
      })

      if (error) throw error

      setGroupByCategory(newGroupByCategory)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error)
    }
  }

  // Vérifier si l'utilisateur peut modifier la liste
  const canModifyList = (listOwnerId: string) => {
    if (!currentUser) return false

    // L'admin peut tout modifier
    if (currentUser.is_admin) return true

    // L'utilisateur peut modifier sa propre liste
    if (currentUser.id === listOwnerId) return true

    // Lulu et Lolo peuvent modifier les listes l'un de l'autre
    if (
      (currentUser.id === "lulu" || currentUser.id === "lolo") &&
      (listOwnerId === "lulu" || listOwnerId === "lolo")
    ) {
      return true
    }

    return false
  }

  // Filtrage des articles selon l'utilisateur visualisé
  const userItems = items.filter((item) => item.user_id === viewingUserId)
  const filteredItems = userItems.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const groupedItems = groupByCategory
    ? categories.reduce(
        (acc, category) => {
          const categoryItems = filteredItems.filter((item) => item.category === category)
          if (categoryItems.length > 0) {
            acc[category] = categoryItems
          }
          return acc
        },
        {} as Record<string, ShoppingItem[]>,
      )
    : { "Tous les articles": filteredItems }

  const completedItems = userItems.filter((item) => item.completed)
  const totalItems = userItems.length
  const completionRate = totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0

  const categoryStats = categories
    .map((category) => {
      const categoryItems = userItems.filter((item) => item.category === category)
      const totalSpent = categoryItems.reduce((sum, item) => sum + (item.price || 0), 0)
      return {
        category,
        count: categoryItems.length,
        totalSpent: totalSpent.toFixed(2),
      }
    })
    .filter((stat) => stat.count > 0)

  const viewingUser = users.find((u) => u.id === viewingUserId)
  const nonAdminUsers = users.filter((u) => !u.is_admin)

  // Ajouter cette condition avant l'écran de connexion
  if (tablesExist === false) {
    return (
      <DatabaseSetup
        onRetry={() => {
          setTablesExist(null)
          loadInitialData()
        }}
      />
    )
  }

  // Écran de chargement pendant la vérification
  if (tablesExist === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Vérification de la base de données...</p>
        </div>
      </div>
    )
  }

  // Écran de connexion
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🛒 Liste de Courses</CardTitle>
            <p className="text-gray-600">Connectez-vous pour accéder à votre liste</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                placeholder="Nom d'utilisateur"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && login()}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && login()}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {loginError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{loginError}</AlertDescription>
              </Alert>
            )}
            <Button onClick={login} className="w-full" disabled={!loginForm.username || !loginForm.password || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs defaultValue="list" className="w-full">
        {/* En-tête fixe avec déconnexion et notifications */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">🛒 Liste de Courses</h1>
              <Badge variant="outline" className="text-xs">
                {currentUser.username}
              </Badge>
              {tablesExist === false && (
                <Badge variant="secondary" className="text-xs">
                  Mode Local
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Bouton notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>

                {/* Panel des notifications */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs">
                          Effacer tout
                        </Button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Aucune notification</div>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification.id} className="p-3 border-b border-gray-100 last:border-b-0">
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.timestamp.toLocaleTimeString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton déconnexion */}
              <Button variant="ghost" size="sm" onClick={logout} className="flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <TabsList className="grid w-full grid-cols-3 h-16 bg-white rounded-none">
            <TabsTrigger value="list" className="flex flex-col gap-1 data-[state=active]:bg-blue-50">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Liste</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex flex-col gap-1 data-[state=active]:bg-blue-50">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Statistiques</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col gap-1 data-[state=active]:bg-blue-50">
              <Settings className="h-5 w-5" />
              <span className="text-xs">Paramètres</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Contenu principal avec padding pour l'en-tête et la navigation */}
        <div className="pt-16 pb-20">
          <TabsContent value="list" className="mt-0">
            <div className="p-4 space-y-4">
              {/* En-tête avec utilisateur */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">Liste de {viewingUser?.username}</h2>
                    {viewingUserId !== currentUser.id && (
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        Modification autorisée
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {completedItems.length}/{totalItems} articles achetés
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600">{completionRate.toFixed(0)}%</div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sélecteur d'utilisateur */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Select value={viewingUserId} onValueChange={setViewingUserId}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nonAdminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        Liste de {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Barre de recherche et filtres */}
              <div className="space-y-3">
                <Input
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <Button
                    variant={groupByCategory ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateUserSettings(!groupByCategory)}
                  >
                    Grouper par catégorie
                  </Button>
                </div>
              </div>

              {/* Liste des articles */}
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                  <div key={groupName}>
                    {groupByCategory && (
                      <h3 className="font-semibold text-gray-700 mb-2 px-2">
                        {groupName} ({groupItems.length})
                      </h3>
                    )}
                    <div className="space-y-2">
                      {groupItems
                        .sort((a, b) => Number(a.completed) - Number(b.completed))
                        .map((item) => (
                          <Card
                            key={item.id}
                            className={`transition-all duration-200 ${
                              item.completed ? "opacity-60 bg-gray-50" : "bg-white hover:shadow-md"
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => toggleItem(item.id)}
                                  className="mt-1"
                                  disabled={!canModifyList(item.user_id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4
                                      className={`font-medium ${
                                        item.completed ? "line-through text-gray-500" : "text-gray-900"
                                      }`}
                                    >
                                      {item.name}
                                    </h4>
                                    {canModifyList(item.user_id) && (
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openEditDialog(item)}
                                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteItem(item.id)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge className={categoryColors[item.category as keyof typeof categoryColors]}>
                                        {item.category}
                                      </Badge>
                                      {item.price && (
                                        <span className="text-sm text-gray-600 font-medium">
                                          {item.price.toFixed(2)}€
                                        </span>
                                      )}
                                      {item.weight && <span className="text-sm text-gray-600">{item.weight}</span>}
                                      {item.store && (
                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                          {item.store}
                                        </span>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 italic">{item.description}</p>
                                    )}
                                    {item.remarks && (
                                      <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                        💡 {item.remarks}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "Aucun article trouvé" : "Aucun article dans cette liste"}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
                <Badge variant="outline">Liste de {viewingUser?.username}</Badge>
              </div>

              {/* Résumé général */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
                    <div className="text-sm text-gray-600">Articles total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {userItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}€
                    </div>
                    <div className="text-sm text-gray-600">Budget total</div>
                  </CardContent>
                </Card>
              </div>

              {/* Statistiques par catégorie */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryStats.map((stat) => (
                      <div key={stat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={categoryColors[stat.category as keyof typeof categoryColors]}>
                            {stat.category}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {stat.count} article{stat.count > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="font-semibold">{stat.totalSpent}€</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Historique des produits les plus utilisés */}
              {productHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Produits les plus achetés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {productHistory.slice(0, 10).map((product) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={categoryColors[product.category as keyof typeof categoryColors]}>
                              {product.category}
                            </Badge>
                            <span className="text-sm font-medium">{product.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{product.usage_count}x</span>
                            {product.price && (
                              <span className="text-sm text-gray-600">{product.price.toFixed(2)}€</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Utilisateur connecté</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{currentUser.username}</Badge>
                    {currentUser.is_admin && <Badge variant="secondary">Administrateur</Badge>}
                    {tablesExist === false && <Badge variant="outline">Mode Local</Badge>}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setIsChangePasswordOpen(true)}
                  >
                    Changer le mot de passe
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Préférences d'affichage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Grouper par catégorie par défaut</Label>
                    <Checkbox checked={groupByCategory} onCheckedChange={(checked) => updateUserSettings(!!checked)} />
                  </div>
                </CardContent>
              </Card>

              {currentUser.is_admin && (
                <Card>
                  <CardHeader>
                    <CardTitle>Administration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setIsAdminPanelOpen(true)}
                    >
                      Panneau d'administration
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Base de données</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    {tablesExist === false ? (
                      <>
                        <p>⚠️ Mode local actif</p>
                        <p>🔄 Données non persistantes</p>
                      </>
                    ) : (
                      <>
                        <p>✅ Connecté à Supabase</p>
                        <p>🔄 Synchronisation automatique</p>
                        <p>📊 {productHistory.length} produits en historique</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>

        {/* Bouton d'ajout flottant - seulement si on peut modifier la liste */}
        {canModifyList(viewingUserId) && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-40" size="icon">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="item-name">Nom de l'article</Label>
                  <div className="relative">
                    <Input
                      id="item-name"
                      placeholder="Ex: Pommes, Lait..."
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addItem()}
                    />
                    {newItemName.length >= 2 && (
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  {/* Suggestions de produits */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {productSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{suggestion.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  className={categoryColors[suggestion.category as keyof typeof categoryColors]}
                                  variant="secondary"
                                >
                                  {suggestion.category}
                                </Badge>
                                <span className="text-xs text-gray-500">{suggestion.usage_count}x utilisé</span>
                              </div>
                            </div>
                            {suggestion.price && (
                              <span className="text-sm font-medium text-green-600">{suggestion.price.toFixed(2)}€</span>
                            )}
                          </div>
                          {suggestion.description && (
                            <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Affichage des informations pré-remplies si une suggestion est sélectionnée */}
                {selectedSuggestion && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">Informations pré-remplies :</p>
                    <div className="space-y-1 text-xs text-blue-700">
                      {selectedSuggestion.description && <p>• Description: {selectedSuggestion.description}</p>}
                      {selectedSuggestion.price && <p>• Prix: {selectedSuggestion.price.toFixed(2)}€</p>}
                      {selectedSuggestion.weight && <p>• Poids: {selectedSuggestion.weight}</p>}
                      {selectedSuggestion.store && <p>• Magasin: {selectedSuggestion.store}</p>}
                      {selectedSuggestion.remarks && <p>• Remarques: {selectedSuggestion.remarks}</p>}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={addItem} className="flex-1" disabled={!newItemName.trim() || !selectedCategory}>
                    Ajouter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      setSelectedSuggestion(null)
                      setNewItemName("")
                      setSelectedCategory("")
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog d'édition */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'article</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nom de l'article</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-category">Catégorie</Label>
                  <Select
                    value={editingItem.category}
                    onValueChange={(value) => {
                      if (value === "Créer une nouvelle catégorie...") {
                        setIsAddCategoryOpen(true)
                      } else {
                        setEditingItem({ ...editingItem, category: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-price">Prix (€)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editingItem.price || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          price: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-weight">Poids/Quantité</Label>
                    <Input
                      id="edit-weight"
                      placeholder="1kg, 500g, 2L..."
                      value={editingItem.weight || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, weight: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-store">Magasin</Label>
                  <Input
                    id="edit-store"
                    placeholder="Carrefour, Leclerc, Monoprix..."
                    value={editingItem.store || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, store: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    placeholder="Détails sur le produit..."
                    value={editingItem.description || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-remarks">Remarques</Label>
                  <Input
                    id="edit-remarks"
                    placeholder="Notes personnelles, préférences..."
                    value={editingItem.remarks || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => updateItem(editingItem)} className="flex-1">
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingItem(null)
                      setIsEditDialogOpen(false)
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Panneau d'administration */}
        <Dialog open={isAdminPanelOpen} onOpenChange={setIsAdminPanelOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Panneau d'Administration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reset-user">Utilisateur</Label>
                <Select
                  value={resetPasswordForm.userId}
                  onValueChange={(value) => setResetPasswordForm({ ...resetPasswordForm, userId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {nonAdminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={resetPassword}
                  className="flex-1"
                  disabled={!resetPasswordForm.userId || !resetPasswordForm.newPassword}
                >
                  Réinitialiser le mot de passe
                </Button>
                <Button variant="outline" onClick={() => setIsAdminPanelOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog changement de mot de passe */}
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Changer le mot de passe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={changePasswordForm.currentPassword}
                  onChange={(e) => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                />
              </div>
              {passwordError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{passwordError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={changePassword}
                  className="flex-1"
                  disabled={
                    !changePasswordForm.currentPassword ||
                    !changePasswordForm.newPassword ||
                    !changePasswordForm.confirmPassword
                  }
                >
                  Changer le mot de passe
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangePasswordOpen(false)
                    setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                    setPasswordError("")
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog création de catégorie */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name">Nom de la catégorie</Label>
                <Input
                  id="category-name"
                  placeholder="Ex: Produits bio, Animaux..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomCategory()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addCustomCategory} className="flex-1" disabled={!newCategoryName.trim()}>
                  Créer la catégorie
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddCategoryOpen(false)
                    setNewCategoryName("")
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  )
}
