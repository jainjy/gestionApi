#!/bin/bash
# test_activities_security.sh

API_URL="http://localhost:3001/api/activities"

echo "=== AUDIT DE SÉCURITÉ - ENDPOINT ACTIVITÉS ==="
echo

# Test 1: Récupérer et analyser les données
echo "1. ANALYSE DES DONNÉES GUIDES :"
curl -s "$API_URL" | \
  jq -r '
    .data[0] as $activity |
    if $activity then
      "Première activité analysée:",
      "  - Titre: \($activity.title)",
      "  - Guide présent: \($activity.guide != null)",
      "",
      "Données guide exposées:",
      if $activity.guide then
        ($activity.guide.user | to_entries | map("    - \(.key): \(.value)") | .[])
      else
        "    Aucun guide"
      end
    else
      "Aucune activité trouvée"
    end
  '

echo

# Test 2: Vérifier absence de données sensibles
echo "2. RECHERCHE DE DONNÉES SENSIBLES :"
curl -s "$API_URL" | \
  jq -r '
    def checkSensitiveData:
      reduce .data[] as $activity (
        {emails: 0, phones: 0, uuids: 0};
        if $activity.guide and $activity.guide.user then
          .emails += (if $activity.guide.user.email then 1 else 0 end) |
          .phones += (if $activity.guide.user.phone then 1 else 0 end) |
          .uuids += (if $activity.guide.user.id and ($activity.guide.user.id | test("^[0-9a-f]{8}-")) then 1 else 0 end)
        else . end
      );
    
    checkSensitiveData as $result |
    "  Emails dans user.guide: \($result.emails) \(if $result.emails == 0 then "✅" else "❌" end)",
    "  Téléphones dans user.guide: \($result.phones) \(if $result.phones == 0 then "✅" else "❌" end)",
    "  UUIDs réels dans user.guide: \($result.uuids) \(if $result.uuids == 0 then "✅" else "❌" end)"
  '

echo

# Test 3: Vérifier la structure sécurisée
echo "3. STRUCTURE SÉCURISÉE ATTENDUE :"
cat << EOF
  ✅ Guide.user devrait avoir:
    - refId (anonymisé)
    - firstName (optionnel)
    - lastName (optionnel) 
    - initials
    - avatar
    - ❌ PAS d'email
    - ❌ PAS de téléphone
    - ❌ PAS d'UUID réel
EOF

echo
echo "=== TEST AVEC FILTRES ==="

# Test avec différents filtres
for filter in "" "?search=rando" "?location=paris" "?featured=true"; do
  echo -n "  Test $filter: "
  curl -s "$API_URL$filter" | \
    jq -e '.data[0].guide.user.email == null and .data[0].guide.user.phone == null' > /dev/null 2>&1 && \
    echo "✅ Sécurité maintenue" || echo "❌ Problème détecté"
done