import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Edit, UserX, UserCheck, Shield, User, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'operator';
  full_name: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

export default function AdminPanel() {
  const { user, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'operator' as 'admin' | 'operator'
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchProfiles();
  }, [isAdmin, navigate]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.password || !formData.full_name) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont requis",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: hashedPassword, error: hashError } = await supabase.rpc('simple_hash', {
        input_text: formData.password
      });

      if (hashError) throw hashError;

      const { error } = await supabase
        .from('profiles')
        .insert({
          username: formData.username,
          password_hash: hashedPassword,
          role: formData.role,
          full_name: formData.full_name,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });

      setIsDialogOpen(false);
      setFormData({ username: '', password: '', full_name: '', role: 'operator' });
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message.includes('duplicate') ? 
          "Ce nom d'utilisateur existe déjà" : 
          "Erreur lors de la création de l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePassword = async (profileId: string, newPassword: string) => {
    if (!newPassword) {
      toast({
        title: "Erreur",
        description: "Le mot de passe ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: hashedPassword, error: hashError } = await supabase.rpc('simple_hash', {
        input_text: newPassword
      });

      if (hashError) throw hashError;

      const { error } = await supabase
        .from('profiles')
        .update({ password_hash: hashedPassword })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Mot de passe mis à jour avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du mot de passe",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: currentStatus ? "Utilisateur désactivé" : "Utilisateur activé",
      });

      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Panel d'Administration</h1>
              <p className="text-muted-foreground">Gestion des utilisateurs et des permissions</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Créez un compte pour un nouvel opérateur ou administrateur
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Nom d'utilisateur unique"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mot de passe sécurisé"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Prénom Nom"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'operator' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operator">Opérateur</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Créer l'utilisateur
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs du système</CardTitle>
            <CardDescription>
              Gérez les comptes utilisateurs et leurs permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{profile.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                        {profile.role === 'admin' ? (
                          <>
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <User className="mr-1 h-3 w-3" />
                            Opérateur
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.is_active ? 'outline' : 'destructive'}>
                        {profile.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Changer le mot de passe</DialogTitle>
                              <DialogDescription>
                                Définir un nouveau mot de passe pour {profile.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  placeholder="Nouveau mot de passe"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleUpdatePassword(profile.id, (e.target as HTMLInputElement).value);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={(e) => {
                                  const input = (e.currentTarget.parentElement?.parentElement?.querySelector('input') as HTMLInputElement);
                                  if (input) {
                                    handleUpdatePassword(profile.id, input.value);
                                  }
                                }}
                              >
                                Mettre à jour
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(profile.id, profile.is_active)}
                          disabled={profile.id === user?.id}
                        >
                          {profile.is_active ? (
                            <UserX className="h-3 w-3" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}