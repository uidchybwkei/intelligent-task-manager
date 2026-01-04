import React from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { PriorityBadge, StatusBadge } from '../components/tasks/Badges';

export function DesignSystem() {
  return (
    <div className="space-y-8 p-4 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Design System</h1>
        <p className="text-slate-500">Core components and tokens</p>
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="default">Primary / Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badges & Status</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <div className="flex gap-4">
            <PriorityBadge priority="high" />
            <PriorityBadge priority="medium" />
            <PriorityBadge priority="low" />
          </div>
          <div className="flex gap-4">
            <StatusBadge status="completed" />
            <StatusBadge status="in_progress" />
            <StatusBadge status="pending" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Standard Card</CardTitle>
            </CardHeader>
            <CardContent>
              This is a standard card component used for general content.
            </CardContent>
          </Card>
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle>Subtle Card</CardTitle>
            </CardHeader>
            <CardContent>
              A subtle variation for secondary content areas.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <Input placeholder="Default input..." />
          <Input placeholder="Disabled input..." disabled />
        </div>
      </section>
    </div>
  );
}
