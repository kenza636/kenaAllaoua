
package com.mycompany.syntaxc;

public class AnalyseurSyntaxique {

    public static int i;       // index dans le tableau
    public static boolean r;   // indique si chaîne correcte
    public static String[] t;  // tableau de mots

    // ==============================
    // Z → S #
    // ==============================
    public static void Z(String ch) {
        t = ch.split("\\s+");
        i = 0;
        r = true;

        S();

        if (i == t.length - 1 && t[i].equals("#") && r == true) {
            System.out.println("✔ La chaîne est acceptée");
        } else {
            System.out.println("✘ La chaîne n'est pas acceptée");
        }
    }

    // ==============================
    // S → DO BLOC WHILE ( COND ) ;
    // ==============================
    public static void S() {

        if (!mot("do")) erreur("do attendu");

        BLOC();

        if (!mot("while")) erreur("while attendu");

        if (!mot("(")) erreur("'(' attendu");

        COND();

        if (!mot(")")) erreur("')' attendu");

        if (!mot(";")) erreur("';' attendu");
    }

    // ==============================
    // BLOC → { INSTRUCTIONS }
    // ==============================
    public static void BLOC() {

        if (!mot("{")) erreur("'{' attendu");

        INSTRUCTIONS();

        if (!mot("}")) erreur("'}' attendu");
    }

    // ==============================
    // INSTRUCTIONS → instruction INSTRUCTIONS | ε
    // ==============================
    public static void INSTRUCTIONS() {

        if (t[i].equals("}")) return; // epsilon

        instruction();
        INSTRUCTIONS();
    }

    // ==============================
    // instruction →
    //    ident = nombre ;
    //    ident ++ ;
    //    ident -- ;
    //    autre ignoré
    // ==============================
    public static void instruction() {

        String mot = t[i];

        // ident ?
        if (estIdent(mot)) {

            i++; // consommer ident

            // ident = nombre ;
            if (mot("=")) {

                if (!estNombre(t[i])) erreur("nombre attendu après '='");
                else i++;

                if (!mot(";")) erreur("';' attendu après affectation");

                return;
            }

            // ident ++ ;
            if (mot("++")) {
                if (!mot(";")) erreur("';' attendu après ++");
                return;
            }

            // ident -- ;
            if (mot("--")) {
                if (!mot(";")) erreur("';' attendu après --");
                return;
            }

            // sinon : instruction ignorée
            return;
        }

        // sinon mot ignoré
        i++;
    }

    // ==============================
    // COND → ident OP nombre
    // ==============================
    public static void COND() {

        if (!estIdent(t[i])) erreur("identifiant attendu dans condition");
        else i++;

        if (!estOperateur(t[i])) erreur("opérateur attendu dans condition");
        else i++;

        if (!estNombre(t[i])) erreur("nombre attendu dans condition");
        else i++;
    }

    // ==============================
    // FONCTIONS UTILITAIRES
    // ==============================
    public static boolean mot(String m) {
        if (t[i].equals(m)) {
            i++;
            return true;
        }
        return false;
    }

    public static void erreur(String msg) {
        System.out.println("Erreur : " + msg + " (lu = '" + t[i] + "')");
        r = false;
        i++; // avancer pour éviter boucle infinie
    }

    public static boolean estIdent(String s) {
        return s.matches("[a-zA-Z_][a-zA-Z0-9_]*");
    }

    public static boolean estNombre(String s) {
        return s.matches("[0-9]+");
    }

    public static boolean estOperateur(String s) {
        return s.equals("<") || s.equals(">") || s.equals("==") ||
               s.equals("!=") || s.equals("<=") || s.equals(">=");
    }
}
