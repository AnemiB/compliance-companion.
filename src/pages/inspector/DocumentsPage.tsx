import { useState, useEffect } from 'react';
import { getAuth, getInspections, type Inspection } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-warning text-warning-foreground',
  completed: 'bg-info text-info-foreground',
  signed: 'bg-success text-success-foreground',
};

const DocumentsPage = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);

  useEffect(() => {
    if (!auth) return;
    setInspections(getInspections().filter(i => i.inspectorName === auth.name && i.status === 'signed'));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">View and manage signed inspection documents</p>
      </div>

      {inspections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">No Documents Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Completed and signed inspections will appear here as documents.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inspections.map(ins => (
            <Card key={ins.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Inspection Report — {ins.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      Signed: {ins.signedAt ? new Date(ins.signedAt).toLocaleDateString() : 'N/A'} •
                      Created: {new Date(ins.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[ins.status]}>{ins.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/inspection/${ins.id}`)}><Eye className="mr-1 h-4 w-4" /> View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
