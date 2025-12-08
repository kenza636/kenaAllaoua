package com.mycompany.analyseurlexicalc;

import java.util.List;
import java.util.Scanner;

public class partiexecutable {

    public static void main(String[] args) {
        AnalyseurLexicalC analyseur = new AnalyseurLexicalC();
        Scanner sc = new Scanner(System.in);
        int choix;
        int choixAnalyse;

        // Programmes C sous forme de chaînes
        String[] programme1 = {
            "// Exemple de boucle do/while avec if/else",
            "#include <stdio.h>",
            "int main() {",
            "    int a, i;",
            "    i = 0;",
            "    do {",
            "        printf(\"Donner une valeur a :\\n\");",
            "        scanf(\"%d\", &a);",
            "        if (a % 2 == 0) {",
            "            printf(\"Le nombre est pair\\n\");",
            "        } else {",
            "            printf(\"Le nombre est impair\\n\");",
            "        }",
            "        i++;",
            "    } while (i <= 5);",
            "    return 0;",
            "}"
        };

        String[] programme2 = {
            "#include <stdio.h>",
            "int main() {",
            "    int n, i, fact;",
            "    char choix;",
            "    do {",
            "        printf(\"Entrez un entier positif : \");",
            "        scanf(\"%d\", &n);",
            "        fact = 1;",
            "        for(i = 1; i <= n; i++)",
            "            fact *= i;",
            "        printf(\"La factorielle de %d est %d\\n\", n, fact);",
            "        printf(\"Voulez-vous continuer ? (o/n) : \");",
            "        scanf(\" %c\", &choix);",
            "    } while(choix == 'o' || choix == 'O');",
            "    printf(\"Fin du programme.\\n\");",
            "    return 0;",
            "}"
        };

        String[] programme3 = {
            "#include <stdio.h>",
            "int main() {",
            "    int compteur = 0;",       
            "    int limite = 5;",
            "    int total = 0;",
            "    do {",
            "        total = total + compteur * 2;",  
            "        int estPair = (compteur % 2 == 0);",
            "        compteur++;",
            "        limite--;",
            "        printf(\"Compteur = %d, Limite = %d, Total = %d, EstPair = %d\\n\", compteur, limite, total, estPair);",
            "    } while (compteur < 10 && limite > 0);",
            "    return 0;",
            "}"
        };

        String[] programme = null;

        while (true) {
            System.out.println("\n===== Analyseur Lexical C =====");
            System.out.println("1. Programme do/while");
            System.out.println("2. Programme do/while factorielle");
            System.out.println("3. Programme do/while compteur");
            System.out.println("4. Saisir votre programme");
            System.out.println("5. Quitter");
            System.out.print("Choisissez un programme : ");
            choix = sc.nextInt();
            sc.nextLine(); // consommer le saut de ligne

            switch (choix) {
                case 1 -> programme = programme1;
                case 2 -> programme = programme2;
                case 3 -> programme = programme3;
                case 4 -> {
                    System.out.println("Saisissez votre programme C ligne par ligne (tapez 'END' pour terminer) :");
                    java.util.List<String> programmeUtilisateur = new java.util.ArrayList<>();
                    while (true) {
                        String ligneSaisie = sc.nextLine();
                        if (ligneSaisie.equalsIgnoreCase("END")) break;
                        programmeUtilisateur.add(ligneSaisie);
                    }
                    programme = programmeUtilisateur.toArray(new String[0]);
                }
                case 5 -> {
                    System.out.println("Au revoir !");
                    return;
                }
                default -> {
                    System.out.println("Option invalide !");
                    continue;
                }
            }

            // Choix de type d'analyse
            System.out.println("\n===== Type d'analyse =====");
            System.out.println("1. Analyse lexicale uniquement");
            System.out.println("2. Analyse lexicale + syntaxique");
            System.out.print("Choisissez l'analyse : ");
            choixAnalyse = sc.nextInt();
            sc.nextLine();

            if (programme != null) {
                // Générer les tokens pour analyse syntaxique
                List<Token> tokens = analyseur.analyserProgrammeTokens(programme);

                // Analyse lexicale
                System.out.println("=== Tokens générés ===");
                for (Token t : tokens) {
                    System.out.println(t);
                }

                // Analyse syntaxique si choix 2
                if (choixAnalyse == 2) {
                    // Création du parser avec la liste de tokens
                    AnalyseurSyntaxiqueC parser = new AnalyseurSyntaxiqueC(tokens);
                    parser.analyserProgramme();
                }
            }
        }
    }
}
