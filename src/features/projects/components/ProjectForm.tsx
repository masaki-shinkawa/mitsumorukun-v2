import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "../api/actions";

export function ProjectForm() {
  return (
    <form action={createProjectAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">案件名</Label>
        <Input id="name" name="name" required placeholder="例: 顧客管理システム刷新" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">概要</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          placeholder="案件の概要や背景を入力（任意）"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">登録する</Button>
      </div>
    </form>
  );
}
