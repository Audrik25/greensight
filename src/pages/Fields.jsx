import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sprout, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FieldCard from "@/components/fieldsight/FieldCard";
import PageHeader from "@/components/shared/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CROP_TYPES = ['Corn', 'Wheat', 'Soybeans', 'Rice', 'Cotton', 'Tomatoes', 'Potatoes', 'Barley', 'Canola', 'Alfalfa', 'Lettuce', 'Strawberries', 'Grapes', 'Coffee', 'Sugarcane', 'Grass'];

export default function Fields() {
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', crop: '', size: '', latitude: '', longitude: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fs-fields"],
    queryFn: () => base44.entities.Field.list("-updated_date", 100),
  });

  async function handleCreate() {
    if (!form.name || !form.crop) return;
    setCreating(true);
    try {
      await base44.entities.Field.create({
        name: form.name,
        crop: form.crop,
        size: parseFloat(form.size) || 0,
        size_unit: 'acres',
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        health_score: 100,
        status: 'healthy',
        is_demo: false,
      });
      queryClient.invalidateQueries({ queryKey: ["fs-fields"] });
      queryClient.invalidateQueries({ queryKey: ["fs-fields-sidebar"] });
      setForm({ name: '', crop: '', size: '', latitude: '', longitude: '' });
      setAddOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Field.delete(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["fs-fields"] });
      queryClient.invalidateQueries({ queryKey: ["fs-fields-sidebar"] });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: '0 4px 32px 4px', maxWidth: 1240, margin: '0 auto' }}>
      <PageHeader
        title="Fields"
        subtitle="Manage your farm fields and monitor their health"
        icon={Sprout}
        actions={<button onClick={() => setAddOpen(true)} className="fs-btn-primary"><Plus style={{ width: 16, height: 16 }} /> Add Field</button>}
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="fs-spin" style={{ width: 32, height: 32, border: '3px solid #252a33', borderTopColor: '#3da970', borderRadius: '50%', margin: '0 auto' }} />
        </div>
      ) : fields.length === 0 ? (
        <div className="fs-card" style={{ padding: 60, textAlign: 'center' }}>
          <Sprout style={{ width: 40, height: 40, color: '#6b7480', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e8eaed', margin: '0 0 8px' }}>No fields yet</h3>
          <p style={{ fontSize: 14, color: '#9aa3af', marginBottom: 20 }}>Add your first field to start monitoring its health and running scans.</p>
          <button onClick={() => setAddOpen(true)} className="fs-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            Add Your First Field
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {fields.map(field => <FieldCard key={field.id} field={field} onDelete={setDeleteTarget} />)}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent style={{ maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 20 }}>Add New Field</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            <div>
              <Label style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', marginBottom: 6, display: 'block' }}>Field Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. North Pasture" />
            </div>
            <div>
              <Label style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', marginBottom: 6, display: 'block' }}>Crop Type *</Label>
              <Select value={form.crop} onValueChange={v => setForm(f => ({ ...f, crop: v }))}>
                <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                <SelectContent>
                  {CROP_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', marginBottom: 6, display: 'block' }}>Field Size (acres)</Label>
              <Input type="number" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="e.g. 45" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', marginBottom: 6, display: 'block' }}>Latitude</Label>
                <Input type="number" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="e.g. 41.878" />
              </div>
              <div>
                <Label style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', marginBottom: 6, display: 'block' }}>Longitude</Label>
                <Input type="number" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="e.g. -87.629" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={creating}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !form.name || !form.crop} style={{ background: '#2d8a5a', color: '#fff' }}>
                {creating ? 'Creating...' : 'Add Field'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 20 }}>Remove field?</DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 14, color: '#9aa3af', lineHeight: 1.5 }}>
            Are you sure you want to remove <strong style={{ color: '#e8eaed' }}>{deleteTarget?.name}</strong>? This will permanently delete the field and cannot be undone.
          </p>
          <DialogFooter style={{ marginTop: 8 }}>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting} style={{ background: '#d64545', color: '#fff' }}>
              {deleting ? 'Removing...' : 'Remove Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}