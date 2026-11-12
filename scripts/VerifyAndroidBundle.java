import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.jar.JarFile;

/** Verifies every payload entry, not just the presence of a signature file. */
class VerifyAndroidBundle {
    public static void main(String[] args) throws Exception {
        if (args.length != 1) throw new IllegalArgumentException("Se requiere la ruta del AAB.");
        String alias = System.getenv("ANDROID_KEY_ALIAS");
        KeyStore keyStore = KeyStore.getInstance(Path.of(System.getenv("ANDROID_KEYSTORE_PATH")).toFile(),
            System.getenv("ANDROID_KEYSTORE_PASSWORD").toCharArray());
        Certificate expected = keyStore.getCertificate(alias);
        if (!(expected instanceof X509Certificate)) throw new SecurityException("Certificado de subida ausente.");
        if (((X509Certificate) expected).getSubjectX500Principal().getName().contains("CN=Android Debug")) {
            throw new SecurityException("No se permite un certificado Android Debug.");
        }
        try (JarFile bundle = new JarFile(args[0], true)) {
            if (bundle.getJarEntry("base/manifest/AndroidManifest.xml") == null) {
                throw new SecurityException("No es un Android App Bundle.");
            }
            int verified = 0;
            var entries = bundle.entries();
            while (entries.hasMoreElements()) {
                var entry = entries.nextElement();
                if (entry.isDirectory()) continue;
                try (InputStream input = bundle.getInputStream(entry)) {
                    input.transferTo(OutputStream.nullOutputStream());
                }
                if (entry.getName().startsWith("META-INF/")) continue;
                var signers = entry.getCodeSigners();
                if (signers == null || signers.length != 1 ||
                    !Arrays.equals(expected.getEncoded(), signers[0].getSignerCertPath().getCertificates().get(0).getEncoded())) {
                    throw new SecurityException("Contenido sin firma o certificado distinto a la llave de subida.");
                }
                verified++;
            }
            if (verified == 0) throw new SecurityException("Bundle vacío.");
            String fingerprint = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(expected.getEncoded()));
            System.out.println("AAB verificado con certificado de subida SHA-256: " + fingerprint);
        }
    }
}
