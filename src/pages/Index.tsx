import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Calendar, TrendingUp, Zap } from "lucide-react";
import fitJogging from "@/assets/fit-jogging.png";
import fitYoga from "@/assets/fit-yoga.png";
import fitGym from "@/assets/fit-gym.png";
import fitExercise from "@/assets/fit-exercise.png";
import fitCricket from "@/assets/fit-cricket.png";
import fitFootball from "@/assets/fit-football.png";
import fitBasketball from "@/assets/fit-basketball.png";
import fitBadminton from "@/assets/fit-badminton.png";
import fitVolleyball from "@/assets/fit-volleyball.png";
import fitSnooker from "@/assets/fit-snooker.png";

const activityData = [
  { name: "Jogging & Stretching", icon: fitJogging, category: "Individual Fitness", categoryColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { name: "Yoga", icon: fitYoga, category: "Individual Fitness", categoryColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { name: "Gym", icon: fitGym, category: "Individual Fitness", categoryColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { name: "Exercise", icon: fitExercise, category: "Individual Fitness", categoryColor: "bg-green-500/10 text-green-700 border-green-500/20" },
  { name: "Cricket", icon: fitCricket, category: "Team Sports", categoryColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { name: "Football", icon: fitFootball, category: "Team Sports", categoryColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { name: "Basketball", icon: fitBasketball, category: "Team Sports", categoryColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { name: "Badminton", icon: fitBadminton, category: "Racket Sports", categoryColor: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
  { name: "Volleyball", icon: fitVolleyball, category: "Team Sports", categoryColor: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { name: "Snooker", icon: fitSnooker, category: "Racket Sports", categoryColor: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-white">
        <div className="text-center space-y-8 max-w-3xl">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold">Fit Connect24</h1>
          <p className="text-xl md:text-2xl text-white/90">
            Connect with fitness partners anytime, anywhere - your 24/7 fitness community
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <Users className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Find Buddies</h3>
              <p className="text-sm text-white/80">Connect with people nearby who share your fitness interests</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <Calendar className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Join Groups</h3>
              <p className="text-sm text-white/80">Participate in local fitness events and group activities</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <TrendingUp className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Stay Motivated</h3>
              <p className="text-sm text-white/80">Track progress, earn badges, and maintain your streaks</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 shadow-xl hover:scale-105 transition-transform"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-xl hover:scale-105 transition-transform"
              onClick={() => navigate("/pricing")}
            >
              <Zap className="mr-2 h-5 w-5" />
              View Pricing
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-xl hover:scale-105 transition-transform"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
          
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Popular Activities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
              {activityData.map((activity) => (
                <div 
                  key={activity.name}
                  className="flex flex-col items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all hover:scale-105"
                >
                  <img 
                    src={activity.icon} 
                    alt={activity.name}
                    className="w-16 h-16 object-contain transition-transform hover:scale-110 drop-shadow-lg"
                  />
                  <span className="text-sm font-medium text-center">{activity.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${activity.categoryColor} border`}
                  >
                    {activity.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/80 mb-3">Want to create an event?</p>
            <Button 
              size="lg" 
              className="text-lg px-8 shadow-xl hover:scale-105 transition-transform"
              onClick={() => navigate("/auth")}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Create Event
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
