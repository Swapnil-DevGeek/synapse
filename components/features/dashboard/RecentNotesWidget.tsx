'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Folder, Clock } from "lucide-react";
import { DashboardNote } from "@/types/dashboard";
import Link from "next/link";

interface RecentNotesWidgetProps {
  notes: DashboardNote[];
  isLoading?: boolean;
  onCreateNote?: () => void;
}

export function RecentNotesWidget({ 
  notes, 
  isLoading = false, 
  onCreateNote 
}: RecentNotesWidgetProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Recent Notes
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCreateNote}
          className="h-8 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              No notes yet. Start writing your first note.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCreateNote}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Note
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Link 
                key={note._id} 
                href={`/notes?noteId=${note._id}`}
                className="block group"
              >
                <div className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {note.title}
                      </h4>
                      {note.isNew && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {note.timeAgo}
                      </div>
                      {note.folder && (
                        <div className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          <span className="truncate max-w-20">{note.folder}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {notes.length >= 5 && (
              <div className="pt-2 border-t">
                <Link href="/notes">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View All Notes
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 