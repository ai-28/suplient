
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin
} from "lucide-react";

export function GroupInfoPanel({ group }) {
  const renderSessionDots = () => {
    const dots = [];
    for (let i = 0; i < group.totalSessions; i++) {
      const isCompleted = i < group.completedSessions;
      dots.push(
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${
            isCompleted ? 'bg-green-500' : 'bg-yellow-400'
          }`}
        />
      );
    }
    return dots;
  };

  return (
    <Card className="shadow-soft border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Users className="h-4 w-4 text-primary" />
          Group Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground font-medium">{group.nextSession}</p>
              <p className="text-xs text-muted-foreground">Next Session</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground font-medium">{group.frequency} • {group.duration}</p>
              <p className="text-xs text-muted-foreground">Schedule & Duration</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground font-medium">{group.location}</p>
              <p className="text-xs text-muted-foreground">Meeting Location</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-foreground font-medium mb-2">Sessions: {group.completedSessions} of {group.totalSessions} completed</p>
            <div className="flex flex-wrap gap-1">
              {renderSessionDots()}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Started</span>
            <span className="text-xs text-muted-foreground">{group.startDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
