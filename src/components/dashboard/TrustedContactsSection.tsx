import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Phone, Mail, Star, StarOff, Loader2, Pencil, X } from "lucide-react";
import { z } from "zod";
import SOSButton from "@/components/sos/SOSButton";


const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone_number: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  relationship: z.string().optional(),
});

interface TrustedContact {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  relationship: string | null;
  is_primary: boolean | null;
  priority?: number | null;
}

const TrustedContactsSection = () => {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    relationship: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("trusted_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .order("priority", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", phone_number: "", email: "", relationship: "" });
    setErrors({});
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setSaving(true);
    setErrors({});

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    if (editingContact) {
      // Update existing contact
      const { error } = await supabase
        .from("trusted_contacts")
        .update({
          name: formData.name,
          phone_number: formData.phone_number,
          email: formData.email || null,
          relationship: formData.relationship || null,
        })
        .eq("id", editingContact.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update contact",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Contact updated successfully",
        });
        resetForm();
        setShowAddDialog(false);
        fetchContacts();
      }
    } else {
      // Add new contact
      const { error } = await supabase.from("trusted_contacts").insert({
        user_id: user.id,
        name: formData.name,
        phone_number: formData.phone_number,
        email: formData.email || null,
        relationship: formData.relationship || null,
        is_primary: contacts.length === 0,
        priority: contacts.length,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add contact",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Contact added successfully",
        });
        resetForm();
        setShowAddDialog(false);
        fetchContacts();
      }
    }
    setSaving(false);
  };

  const handleEdit = (contact: TrustedContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email || "",
      relationship: contact.relationship || "",
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("trusted_contacts").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Contact deleted",
      });
      fetchContacts();
    }
  };

  const togglePrimary = async (id: string, currentPrimary: boolean | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // If setting as primary, unset all others first
    if (!currentPrimary) {
      await supabase
        .from("trusted_contacts")
        .update({ is_primary: false })
        .eq("user_id", user.id);
    }

    const { error } = await supabase
      .from("trusted_contacts")
      .update({ is_primary: !currentPrimary })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    } else {
      fetchContacts();
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Trusted Contacts</CardTitle>
              <CardDescription>Manage your emergency contacts</CardDescription>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-bg">
                <Plus className="w-4 h-4 mr-1" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingContact ? "Edit Contact" : "Add Trusted Contact"}</DialogTitle>
                <DialogDescription>
                  {editingContact 
                    ? "Update the contact information below"
                    : "Add someone who will be notified in emergencies"
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contact name"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+91 9876543210"
                    className={errors.phone_number ? "border-destructive" : ""}
                  />
                  {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    placeholder="e.g., Parent, Friend, Partner"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddDialog(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="gradient-bg">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {editingContact ? "Update" : "Add"} Contact
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No trusted contacts yet</p>
            <p className="text-sm">Add contacts who will be notified in emergencies</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{contact.name}</p>
                      {contact.is_primary && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone_number}
                      </span>
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                    {contact.relationship && (
                      <p className="text-xs text-muted-foreground mt-1">{contact.relationship}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePrimary(contact.id, contact.is_primary)}
                    title={contact.is_primary ? "Remove as primary" : "Set as primary"}
                  >
                    {contact.is_primary ? (
                      <Star className="w-4 h-4 text-primary fill-primary" />
                    ) : (
                      <StarOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(contact)}
                    title="Edit contact"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(contact.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline SOS Button */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Quick SOS - Hold to alert all contacts
          </p>
          <SOSButton variant="inline" />
        </div>
      </CardContent>
    </Card>
  );
};

export default TrustedContactsSection;
