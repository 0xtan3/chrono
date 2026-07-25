export const CATS = {
  foundations: { label: 'Linux & Foundations', color: '#a78bfa' },
  containers_cicd: { label: 'Containers & CI/CD', color: '#f87171' },
  kubernetes_iac: { label: 'Kubernetes & IaC', color: '#34d399' },
  aws_security: { label: 'AWS Security', color: '#fbbf24' },
  obs_siem: { label: 'Observability & SIEM', color: '#38bdf8' },
  adv_security: { label: 'Advanced Security', color: '#fb923c' },
  python: { label: 'Python', color: '#c084fc' },
  dsa: { label: 'DSA & Algorithms', color: '#f0abfc' },
  sys_design: { label: 'System Design', color: '#7dd3fc' },
  certifications: { label: 'Certifications', color: '#fbbf24' },
};

export const CAT_ORDER = Object.keys(CATS);

export const WEEK_GROUPS = [
  { key: 'Wk1', label: 'Week 1: Core Foundations' },
  { key: 'Wk2', label: 'Week 2: DevSecOps & Net' },
  { key: 'Wk3', label: 'Week 3: Docker & Hardening' },
  { key: 'Wk4', label: 'Week 4: CI/CD & Vault' },
  { key: 'Wk5', label: 'Week 5: Kubernetes Core & RBAC' },
  { key: 'Wk6', label: 'Week 6: IaC & Terraform' },
  { key: 'Wk7', label: 'Week 7: AWS Security & EKS' },
  { key: 'Wk8', label: 'Week 8: Obs & Splunk/ELK' },
  { key: 'Wk9', label: 'Week 9: Supply Chain & Zero Trust' },
  { key: 'Wk10', label: 'Week 10: Auto-Remediation' },
  { key: 'Wk11', label: 'Week 11: EKS Pipeline Project' },
  { key: 'Wk12', label: 'Week 12: final Projects & Apply' },
];

export const ITEMS = [
  // foundations
  { id: 'f01', cat: 'foundations', label: 'Learning Linux Command Line', src: 'll', week: 'Wk1', url: 'https://www.linkedin.com/learning/learning-linux-command-line-14447912', ytUrl: 'https://www.youtube.com/watch?v=ROjZy1WbCIA' },
  { id: 'f02', cat: 'foundations', label: 'Linux for Developers', src: 'll', week: 'Wk1', url: 'https://www.linkedin.com/learning/topics/linux', ytUrl: 'https://www.youtube.com/watch?v=ZtqBQ68cfJc' },
  { id: 'f03', cat: 'foundations', label: 'Git Essential Training', src: 'll', week: 'Wk1', url: 'https://www.linkedin.com/learning/git-essential-training-25677984', ytUrl: 'https://www.youtube.com/watch?v=RGOj5yH7evk' },
  { id: 'f04', cat: 'foundations', label: 'DevOps Foundations', src: 'll', week: 'Wk1', url: 'https://www.linkedin.com/learning/devops-foundations', ytUrl: 'https://www.youtube.com/watch?v=j5Zsa_eOXeY' },
  { id: 'f05', cat: 'foundations', label: 'DevOps Foundations: DevSecOps', src: 'll', week: 'Wk2', url: 'https://www.linkedin.com/learning/devops-foundations-devsecops-17416896', ytUrl: 'https://www.youtube.com/watch?v=nrhxNNH5lt0' },
  { id: 'f06', cat: 'foundations', label: 'Networking Foundations', src: 'll', week: 'Wk2', url: 'https://www.linkedin.com/learning/topics/networking', ytUrl: 'https://www.youtube.com/watch?v=qiQR5rTSshw' },
  { id: 'f07', cat: 'foundations', label: 'Cybersecurity Foundations', src: 'll', week: 'Wk2', url: 'https://www.linkedin.com/learning/cybersecurity-foundations-22006082', ytUrl: 'https://www.youtube.com/watch?v=U_P23SqJaDc' },
  { id: 'f08', cat: 'foundations', label: 'OverTheWire: Bandit (levels 0–20)', src: 'fr', week: 'Wk1', url: 'https://overthewire.org/wargames/bandit/' },

  // containers_cicd
  { id: 'c01', cat: 'containers_cicd', label: 'Docker Essential Training', src: 'll', week: 'Wk3', url: 'https://www.linkedin.com/learning/docker-essential-training', ytUrl: 'https://www.youtube.com/watch?v=3c-iBn73dDE' },
  { id: 'c02', cat: 'containers_cicd', label: 'Learning Docker', src: 'll', week: 'Wk3', url: 'https://www.linkedin.com/learning/topics/docker', ytUrl: 'https://www.youtube.com/watch?v=pTFZFxd5hgI' },
  { id: 'c03', cat: 'containers_cicd', label: 'Docker Security: Container Hardening', src: 'll', week: 'Wk3', url: 'https://www.linkedin.com/learning/topics/docker', ytUrl: 'https://www.youtube.com/watch?v=KINjI1tlo2w' },
  { id: 'c04', cat: 'containers_cicd', label: 'Learning the OWASP Top 10', src: 'll', week: 'Wk3', url: 'https://www.linkedin.com/learning/learning-the-owasp-top-10-9364599', ytUrl: 'https://www.youtube.com/watch?v=rWHvp7rUka8' },
  { id: 'c05', cat: 'containers_cicd', label: 'GitHub Actions for CI/CD', src: 'll', week: 'Wk4', url: 'https://www.linkedin.com/learning/topics/github-actions', ytUrl: 'https://www.youtube.com/watch?v=R8_veQiYBjI' },
  { id: 'c06', cat: 'containers_cicd', label: 'Advanced GitHub Actions', src: 'yt', week: 'Wk4', ytUrl: 'https://www.youtube.com/watch?v=mFFXuXjVgkU' },
  { id: 'c07', cat: 'containers_cicd', label: 'Learning Jenkins', src: 'll', week: 'Wk4', url: 'https://www.linkedin.com/learning/topics/jenkins', ytUrl: 'https://www.youtube.com/watch?v=6YZvp2GwT0A' },
  { id: 'c08', cat: 'containers_cicd', label: 'DevSecOps: SAST/DAST/SCA Pipeline', src: 'll', week: 'Wk4', url: 'https://www.linkedin.com/learning/paths/get-ahead-in-devsecops', ytUrl: 'https://www.youtube.com/watch?v=aw6ED1LNPWY' },
  { id: 'c09', cat: 'containers_cicd', label: 'Learning HashiCorp Vault', src: 'll', week: 'Wk4', url: 'https://www.linkedin.com/learning/learning-hashicorp-vault', ytUrl: 'https://www.youtube.com/watch?v=gJmMmHkpB2Q' },

  // kubernetes_iac
  { id: 'k01', cat: 'kubernetes_iac', label: 'Learning Kubernetes', src: 'll', week: 'Wk5', url: 'https://www.linkedin.com/learning/learning-kubernetes-16086900', ytUrl: 'https://www.youtube.com/watch?v=X48VuDVv0do' },
  { id: 'k02', cat: 'kubernetes_iac', label: 'Kubernetes Essential Training: App Dev', src: 'll', week: 'Wk5', url: 'https://www.linkedin.com/learning/kubernetes-essential-training-application-development', ytUrl: 'https://www.youtube.com/watch?v=s_o8dwzRlu4' },
  { id: 'k03', cat: 'kubernetes_iac', label: 'CKS Cert Prep (K8s Security)', src: 'll', week: 'Wk5', url: 'https://www.linkedin.com/learning/certified-kubernetes-security-specialist-cks-cert-prep', ytUrl: 'https://www.youtube.com/watch?v=d9xfB5qaOfg' },
  { id: 'k04', cat: 'kubernetes_iac', label: 'Learning Terraform', src: 'll', week: 'Wk6', url: 'https://www.linkedin.com/learning/learning-terraform-2', ytUrl: 'https://www.youtube.com/watch?v=l5k1ai_GBDE' },
  { id: 'k05', cat: 'kubernetes_iac', label: 'Terraform Essential Training', src: 'll', week: 'Wk6', url: 'https://www.linkedin.com/learning/topics/terraform', ytUrl: 'https://www.youtube.com/watch?v=SLB_c_ayRMo' },
  { id: 'k06', cat: 'kubernetes_iac', label: 'IaC Security: Checkov & Terrascan', src: 'yt', week: 'Wk6', ytUrl: 'https://www.youtube.com/watch?v=68CHRlb5m8g' },
  { id: 'k07', cat: 'kubernetes_iac', label: 'OPA / Kyverno — TechWorld with Nana', src: 'yt', week: 'Wk6', ytUrl: 'https://www.youtube.com/watch?v=l3j57-0KFWQ' },
  { id: 'k08', cat: 'kubernetes_iac', label: 'GitOps / ArgoCD — TechWorld with Nana', src: 'yt', week: 'Wk6', ytUrl: 'https://www.youtube.com/watch?v=MeU5_k9ssrs' },

  // aws_security
  { id: 'a01', cat: 'aws_security', label: 'AWS Essential Training for Developers', src: 'll', week: 'Wk7', url: 'https://www.linkedin.com/learning/aws-essential-training-for-developers-17237791', ytUrl: 'https://www.youtube.com/watch?v=k1RI5locZE4' },
  { id: 'a02', cat: 'aws_security', label: 'AWS IAM: Identity and Access Management', src: 'll', week: 'Wk7', url: 'https://www.linkedin.com/learning/topics/aws-iam', ytUrl: 'https://www.youtube.com/watch?v=iF9fs8Rw4Uo' },
  { id: 'a03', cat: 'aws_security', label: 'Running Kubernetes on AWS (EKS)', src: 'll', week: 'Wk7', url: 'https://www.linkedin.com/learning/running-kubernetes-on-aws-eks-2021', ytUrl: 'https://www.youtube.com/watch?v=p6xDCz00TxU' },
  { id: 'a04', cat: 'aws_security', label: 'AWS Security Essentials', src: 'll', week: 'Wk7', url: 'https://www.linkedin.com/learning/topics/aws-security', ytUrl: 'https://www.youtube.com/watch?v=Ia-UEYYR44s' },
  { id: 'a05', cat: 'aws_security', label: 'AWS Security Best Practices', src: 'll', week: 'Wk8', url: 'https://www.linkedin.com/learning/topics/aws-security', ytUrl: 'https://www.youtube.com/watch?v=_eWyiiFqaKs' },
  { id: 'a06', cat: 'aws_security', label: 'AWS CloudTrail + EventBridge Auto-Remediation', src: 'yt', week: 'Wk10', ytUrl: 'https://www.youtube.com/watch?v=Ia-UEYYR44s' },
  { id: 'a07', cat: 'aws_security', label: 'AWS Multi-Account Architecture (Control Tower)', src: 'yt', week: 'Wk9', ytUrl: 'https://www.youtube.com/watch?v=T2QLDowrCBg' },
  { id: 'a08', cat: 'aws_security', label: 'AWS Certified Security Specialty Prep', src: 'll', week: 'Wk10', url: 'https://www.linkedin.com/learning/topics/aws-certified-security-specialty', ytUrl: 'https://www.youtube.com/watch?v=oBM8DeLNHqQ' },

  // obs_siem
  { id: 'o01', cat: 'obs_siem', label: 'Prometheus + Grafana — TechWorld with Nana', src: 'yt', week: 'Wk8', ytUrl: 'https://www.youtube.com/watch?v=h4Sl21AKiDg' },
  { id: 'o02', cat: 'obs_siem', label: 'K8s Monitoring with Prometheus', src: 'll', week: 'Wk8', url: 'https://www.linkedin.com/learning/kubernetes-monitoring-with-prometheus', ytUrl: 'https://www.youtube.com/watch?v=QoDqxm7ybLc' },
  { id: 'o03', cat: 'obs_siem', label: 'Learning Splunk', src: 'll', week: 'Wk8', url: 'https://www.linkedin.com/learning/learning-splunk-22169111', ytUrl: 'https://www.youtube.com/watch?v=SSsGsT8y0u0' },
  { id: 'o04', cat: 'obs_siem', label: 'Learning Elastic Stack (ELK)', src: 'll', week: 'Wk8', url: 'https://www.linkedin.com/learning/learning-elastic-stack', ytUrl: 'https://www.youtube.com/watch?v=tBoLDpTWVOM' },
  { id: 'o05', cat: 'obs_siem', label: 'Istio Service Mesh — TechWorld with Nana', src: 'yt', week: 'Wk8', ytUrl: 'https://www.youtube.com/watch?v=16fgzklcF7Y' },

  // adv_security
  { id: 's01', cat: 'adv_security', label: 'Supply Chain Security: Sigstore/Cosign/SLSA', src: 'yt', week: 'Wk9', ytUrl: 'https://www.youtube.com/watch?v=x4BJ1bKMX_4' },
  { id: 's02', cat: 'adv_security', label: 'Zero Trust Security — NetworkChuck', src: 'yt', week: 'Wk9', ytUrl: 'https://www.youtube.com/watch?v=FCX0i7-5iCU' },
  { id: 's03', cat: 'adv_security', label: 'Threat Modeling Foundations (STRIDE)', src: 'll', week: 'Wk9', url: 'https://www.linkedin.com/learning/topics/threat-modeling', ytUrl: 'https://www.youtube.com/watch?v=GqmQg-cszw4' },
  { id: 's04', cat: 'adv_security', label: 'AWS Multi-Account + SCPs + Control Tower', src: 'yt', week: 'Wk9', ytUrl: 'https://www.youtube.com/watch?v=T2QLDowrCBg' },
  { id: 's05', cat: 'adv_security', label: 'EventBridge + Lambda Auto-Remediation Patterns', src: 'yt', week: 'Wk10', ytUrl: 'https://www.youtube.com/watch?v=KMzUDMxEnPk' },
  { id: 's06', cat: 'adv_security', label: 'K8s Admission Webhooks (Mutating + Validating)', src: 'yt', week: 'Wk10', ytUrl: 'https://www.youtube.com/watch?v=j-KXFezfCwU' },
  { id: 's07', cat: 'adv_security', label: 'GRC: SOC2, PCI-DSS, GDPR, ISO 27001', src: 'll', week: 'Wk9', url: 'https://www.linkedin.com/learning/cybersecurity-foundations-governance-risk-and-compliance-grc-25657666' },
  { id: 's08', cat: 'adv_security', label: 'Cyber Incident Response & Forensics', src: 'll', week: 'Wk9', url: 'https://www.linkedin.com/learning/learning-cyber-incident-response-and-digital-forensics-21598044', ytUrl: 'https://www.youtube.com/watch?v=Dk-ZqQ-bfy4' },

  // python
  { id: 'p01', cat: 'python', label: 'Python Essential Training', src: 'll', week: 'Wk1', url: 'https://www.linkedin.com/learning/python-essential-training-18764650', ytUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
  { id: 'p02', cat: 'python', label: 'CS50P — Harvard Python (FREE)', src: 'fr', week: 'Wk2', url: 'https://cs50.harvard.edu/python/' },
  { id: 'p03', cat: 'python', label: 'Python OOP', src: 'll', week: 'Wk3', url: 'https://www.linkedin.com/learning/python-object-oriented-programming-22888296', ytUrl: 'https://www.youtube.com/watch?v=JeznW_7DlB0' },
  { id: 'p04', cat: 'python', label: 'Advanced Python', src: 'll', week: 'Wk5', url: 'https://www.linkedin.com/learning/advanced-python', ytUrl: 'https://www.youtube.com/watch?v=HGOBQPFzWKo' },
  { id: 'p05', cat: 'python', label: 'Python Security Libraries', src: 'yt', week: 'Wk9', ytUrl: 'https://www.youtube.com/watch?v=0jzjK0S8L9E' },
  { id: 'p06', cat: 'python', label: 'Build REST APIs with FastAPI', src: 'll', week: 'Wk7', url: 'https://www.linkedin.com/learning/build-rest-apis-with-fastapi', ytUrl: 'https://www.youtube.com/watch?v=0sOvCWFmrtA' },
  { id: 'p07', cat: 'python', label: 'Python DSA & Algorithms', src: 'll', week: 'Wk8', url: 'https://www.linkedin.com/learning/python-data-structures-and-algorithms' },
  { id: 'p08', cat: 'python', label: 'Automate the Boring Stuff', src: 'fr', week: 'Wk6', url: 'https://automatetheboringstuff.com/' },

  // dsa
  { id: 'd01', cat: 'dsa', label: 'LL Prog. Foundations: Data Structures', src: 'll', week: 'Wk1', url: 'https://www.linkedin.com/learning/programming-foundations-data-structures' },
  { id: 'd02', cat: 'dsa', label: 'Udemy §1–2: Big O + Arrays', src: 'ud', week: 'Wk1', url: 'https://www.udemy.com/course/data-structures-algorithms-python/' },
  { id: 'd03', cat: 'dsa', label: 'Udemy §3–4: Linked Lists', src: 'ud', week: 'Wk2', url: 'https://www.udemy.com/course/data-structures-algorithms-python/' },
  { id: 'd04', cat: 'dsa', label: 'Udemy §5–6: Stacks + Queues', src: 'ud', week: 'Wk3', url: 'https://www.udemy.com/course/data-structures-algorithms-python/' },
  { id: 'd05', cat: 'dsa', label: 'Udemy §7–8: Binary Trees + BST', src: 'ud', week: 'Wk4', url: 'https://www.udemy.com/course/data-structures-algorithms-python/' },
  { id: 'd06', cat: 'dsa', label: 'LL Prog. Foundations: Algorithms', src: 'll', week: 'Wk4', url: 'https://www.linkedin.com/learning/programming-foundations-algorithms' },
  { id: 'd07', cat: 'dsa', label: 'Udemy §9–10: Graphs + Sorting', src: 'ud', week: 'Wk5', url: 'https://www.udemy.com/course/data-structures-algorithms-python/' },
  { id: 'd08', cat: 'dsa', label: 'Udemy §11–12: Recursion + DP', src: 'ud', week: 'Wk7', url: 'https://www.udemy.com/course/data-structures-algorithms-python/' },
  { id: 'd09', cat: 'dsa', label: 'NeetCode: Heaps + Tries', src: 'nc', week: 'Wk9', url: 'https://neetcode.io/roadmap' },
  { id: 'd10', cat: 'dsa', label: 'NeetCode: Backtracking + Advanced Graphs', src: 'nc', week: 'Wk10', url: 'https://neetcode.io/roadmap' },
  { id: 'd11', cat: 'dsa', label: 'NeetCode: Bit Manipulation + Math', src: 'nc', week: 'Wk10', url: 'https://neetcode.io/roadmap' },
  { id: 'd12', cat: 'dsa', label: 'LeetCode: 50+ milestone', src: 'nc', week: 'Wk4', url: 'https://leetcode.com/' },
  { id: 'd13', cat: 'dsa', label: 'LeetCode: 100+ milestone', src: 'nc', week: 'Wk8', url: 'https://leetcode.com/' },
  { id: 'd14', cat: 'dsa', label: 'LeetCode: 150+ milestone', src: 'nc', week: 'Wk12', url: 'https://leetcode.com/' },

  // sys_design
  { id: 'sd01', cat: 'sys_design', label: 'System Design Primer (250k stars)', src: 'fr', week: 'Wk9', url: 'https://github.com/donnemartin/system-design-primer' },
  { id: 'sd02', cat: 'sys_design', label: 'Design a SIEM (1M events/sec)', src: 'fr', week: 'Wk9', url: 'https://github.com/donnemartin/system-design-primer' },
  { id: 'sd03', cat: 'sys_design', label: 'Design URL Shortener + Twitter feed', src: 'fr', week: 'Wk10', url: 'https://bytebytego.com/' },
  { id: 'sd04', cat: 'sys_design', label: 'Design WhatsApp + Netflix', src: 'fr', week: 'Wk11', url: 'https://github.com/donnemartin/system-design-primer' },
  { id: 'sd05', cat: 'sys_design', label: 'Distributed Rate Limiter (Security)', src: 'fr', week: 'Wk11', url: 'https://github.com/donnemartin/system-design-primer' },
  { id: 'sd06', cat: 'sys_design', label: '5 mock SD interviews (Pramp)', src: 'fr', week: 'Wk12', url: 'https://www.pramp.com/' },

  // certifications
  { id: 'ct01', cat: 'certifications', label: 'AZ-900: Azure Fundamentals', src: 'fr', week: 'Wk4', url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/' },
  { id: 'ct02', cat: 'certifications', label: 'SC-900: Security Compliance Fund.', src: 'fr', week: 'Wk5', url: 'https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/' },
  { id: 'ct03', cat: 'certifications', label: 'AZ-500: Azure Security Engineer', src: 'fr', week: 'Wk8', url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-security-engineer/' },
  { id: 'ct04', cat: 'certifications', label: 'AWS Cloud Practitioner (CLF-C02)', src: 'fr', week: 'Wk10', url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/' },
  { id: 'ct05', cat: 'certifications', label: 'HashiCorp Terraform Associate', src: 'fr', week: 'Wk12', url: 'https://www.hashicorp.com/certification/terraform-associate' },
];
