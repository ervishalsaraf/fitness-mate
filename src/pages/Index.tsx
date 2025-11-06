import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Users, Calendar, TrendingUp } from "lucide-react";
import fitJogging from "@/assets/fit-jogging.png";
import fitYoga from "@/assets/fit-yoga.png";
import fitGym from "@/assets/fit-gym.png";
import fitExercise from "@/assets/fit-exercise.png";
import fitCricket from "@/assets/fit-cricket.png";
import fitFootball from "@/assets/fit-football.png";
import fitBasketball from "@/assets/fit-basketball.png";

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
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
          
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8">Popular Activities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-6">
              {[
                { name: "Jogging & Stretching", icon: fitJogging },
                { name: "Yoga", icon: fitYoga },
                { name: "Gym", icon: fitGym },
                { name: "Exercise", icon: fitExercise },
                { name: "Cricket", icon: fitCricket },
                { name: "Football", icon: fitFootball },
                { name: "Basketball", icon: fitBasketball }
              ].map((activity) => (
                <div 
                  key={activity.name}
                  className="flex flex-col items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all hover:scale-105"
                >
                  <img 
                    src={activity.icon} 
                    alt={activity.name}
                    className="w-16 h-16 object-contain transition-transform hover:scale-110 drop-shadow-lg"
                  />
                  <span className="text-sm font-medium">{activity.name}</span>
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
