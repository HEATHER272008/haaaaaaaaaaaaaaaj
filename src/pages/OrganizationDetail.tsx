import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Loader2, Users } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  type: string;
  description: string | null;
  teacher_in_charge: string | null;
}

interface OrganizationMember {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  display_order: number | null;
  member_category: string | null;
}

const OrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrganization();
      fetchMembers();
    }
  }, [id]);

  const fetchOrganization = async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      setOrganization(data);
    }
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", id)
      .order("display_order", { ascending: true });

    if (data) {
      setMembers(data);
    }
  };

  // Group members by member_category from database
  const groupMembers = () => {
    const grouped: Record<string, OrganizationMember[]> = {};

    members.forEach((member) => {
      const category = member.member_category || "Members";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(member);
    });

    // Define display order for categories
    const categoryOrder = [
      "Officers",
      "Grade Level Representatives",
      "Department Heads",
      "Faculty",
      "Staff",
      "Student Leaders",
      "Members"
    ];

    // Sort grouped object by category order
    const sortedGroups: { category: string; members: OrganizationMember[] }[] = [];
    
    categoryOrder.forEach((cat) => {
      if (grouped[cat] && grouped[cat].length > 0) {
        sortedGroups.push({ category: cat, members: grouped[cat] });
      }
    });

    // Add any remaining categories not in the predefined order
    Object.keys(grouped).forEach((cat) => {
      if (!categoryOrder.includes(cat) && grouped[cat].length > 0) {
        sortedGroups.push({ category: cat, members: grouped[cat] });
      }
    });

    return sortedGroups;
  };

  const memberGroups = groupMembers();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Organization Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The organization you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/organizations">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const MemberCard = ({ member }: { member: OrganizationMember }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <h4 className="font-semibold text-foreground">{member.name}</h4>
        {member.position && (
          <p className="text-sm text-primary font-medium">{member.position}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        title={organization.name}
        subtitle={organization.type}
      />

      <div className="container mx-auto px-4 py-12">
        <Link to="/organizations">
          <Button variant="outline" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
        </Link>

        {/* Organization Info */}
        <Card className="mb-12 border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {organization.description || "No description available."}
                </p>
              </div>
              <div>
                {organization.teacher_in_charge && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Teacher-in-Charge</p>
                          <p className="text-xl font-semibold text-primary">
                            {organization.teacher_in_charge}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Section */}
        {members.length === 0 ? (
          <div className="text-center py-12 bg-secondary rounded-lg">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No members listed yet.</p>
            <p className="text-sm text-muted-foreground">
              Contact the organization adviser for membership information.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {memberGroups.map((group) => (
              <div key={group.category}>
                <h3 className="text-2xl font-serif font-bold text-primary mb-6 text-center">
                  {group.category}
                </h3>
                <div className={`grid gap-6 ${
                  group.category === "Members" 
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4" 
                    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                }`}>
                  {group.members.map((member) => (
                    group.category === "Members" ? (
                      <Card key={member.id} className="border-0 shadow-sm">
                        <CardContent className="p-3 text-center">
                          <span className="text-sm font-medium">{member.name}</span>
                          {member.position && (
                            <p className="text-xs text-muted-foreground">{member.position}</p>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <MemberCard key={member.id} member={member} />
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationDetail;
