"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Database, Play } from "lucide-react"

interface DatabaseSetupProps {
  onRetry: () => void
}

export function DatabaseSetup({ onRetry }: DatabaseSetupProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Configuration de la Base de Données</CardTitle>
          <p className="text-gray-600">Les tables de base de données n'ont pas encore été créées dans Supabase</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Configuration requise :</strong> Les tables de base de données doivent être créées dans votre
              projet Supabase avant de pouvoir utiliser l'application avec persistance des données.
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-2 text-blue-800">Mode de fonctionnement actuel :</h4>
            <p className="text-sm text-blue-700">
              L'application fonctionne actuellement en mode local. Vos données ne seront pas sauvegardées entre les
              sessions. Pour activer la sauvegarde permanente, configurez la base de données Supabase.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Étapes à suivre :</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Connectez-vous à votre tableau de bord Supabase</li>
                <li>Allez dans l'onglet "SQL Editor"</li>
                <li>
                  Exécutez le script <code className="bg-gray-100 px-2 py-1 rounded">scripts/01-create-tables.sql</code>
                </li>
                <li>
                  Puis exécutez le script{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">scripts/02-seed-data.sql</code>
                </li>
                <li>Revenez ici et cliquez sur "Réessayer"</li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Scripts disponibles :</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-green-600" />
                  <code>scripts/01-create-tables.sql</code> - Création des tables
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-green-600" />
                  <code>scripts/02-seed-data.sql</code> - Données initiales
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onRetry} className="flex-1">
              Réessayer la connexion
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
              className="bg-transparent"
            >
              Ouvrir Supabase
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Une fois les scripts exécutés, l'application fonctionnera avec :</p>
            <div className="mt-2 space-y-1">
              <p>
                <strong>Utilisateurs :</strong> Lulu, Lolo, Admin
              </p>
              <p>
                <strong>Mot de passe :</strong> Misty123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
