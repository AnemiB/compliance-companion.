import { useState } from 'react';
import { getAuth } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const auth = getAuth();
  const [name, setName] = useState(auth?.name || '');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('Gauteng');

  const handleSave = () => {
    toast.success('Profile updated successfully');
  };

  if (!auth) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your inspector profile</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
              {auth.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{auth.name}</h2>
            <p className="text-sm text-muted-foreground">{auth.email}</p>
            <Badge className="mt-2 bg-primary text-primary-foreground">Labour Inspector</Badge>
            <div className="mt-4 w-full border-t pt-4 text-left text-sm">
              <div className="flex items-center gap-2 py-1"><Mail className="h-4 w-4 text-muted-foreground" />{auth.email}</div>
              <div className="flex items-center gap-2 py-1"><Shield className="h-4 w-4 text-muted-foreground" />Role: Inspector</div>
              <div className="flex items-center gap-2 py-1"><User className="h-4 w-4 text-muted-foreground" />Region: {region}</div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Email Address</Label><Input value={auth.email} disabled /></div>
              <div><Label>Phone Number</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 XX XXX XXXX" /></div>
              <div>
                <Label>Region</Label>
                <select value={region} onChange={e => setRegion(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Gauteng</option>
                  <option>Western Cape</option>
                  <option>KwaZulu-Natal</option>
                  <option>Eastern Cape</option>
                  <option>Free State</option>
                  <option>Limpopo</option>
                  <option>Mpumalanga</option>
                  <option>North West</option>
                  <option>Northern Cape</option>
                </select>
              </div>
            </div>
            <div><Label>Inspector ID</Label><Input value={`INS-${auth.email.length}${Date.now().toString().slice(-4)}`} disabled /></div>
            <Button onClick={handleSave}><Save className="mr-1 h-4 w-4" /> Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
